// sockets/guardianChat.js
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const GuardianMessage = require("../models/community/guardianMessage");
const GuardianGroup = require("../models/community/guardianGroup");

function initGuardianChat(httpServer, corsOrigins = ["*"]) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigins, methods: ["GET", "POST"] },
  });

  // --- Auth gate on connection ---
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));

      const user = jwt.verify(token, process.env.JWT_SECRET);
      // normalize id shape
      user._id = user._id || user.id;

      if (user.role !== "guardian" && user.role !== "admin") {
        return next(new Error("Forbidden"));
      }

      socket.user = user;
      next();
    } catch (e) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("socket connect", { userId: socket.user._id, name: socket.user.fullName });
    // ---- join a guardian group room (idempotent auto-join) ----
    socket.on("joinGroup", async (groupId) => {
      try {
        const g = await GuardianGroup.findById(groupId);
        if (!g) return socket.emit("chat_error", "Group not found");

        // auto-add member if missing
        await GuardianGroup.updateOne(
          { _id: groupId },
          { $addToSet: { members: socket.user._id } }
        );

        socket.join(groupId);
        socket.emit("joined", { groupId });
      } catch (e) {
        socket.emit("chat_error", "Failed to join group");
      }
    });

    // ---- send a message ----
    socket.on("sendMessage", async ({ groupId, text }) => {
       console.log("sendMessage by", socket.user._id);
      try {
        if (!text || !text.trim()) return;

        const g = await GuardianGroup.findById(groupId);
        if (!g) return socket.emit("chat_error", "Group not found");

        const isMember = g.members.some(
          (m) => String(m) === String(socket.user._id)
        );
        if (!isMember) return socket.emit("chat_error", "Not a member");

        const msg = await GuardianMessage.create({
          groupId,
          senderId: socket.user._id,
          text: text.trim(),
        });

        // populate sender for UI convenience
        const populated = await msg.populate({
          path: "senderId",
          select: "fullName email",
        });

        io.to(groupId).emit("newMessage", {
          _id: msg._id,
          groupId,
          senderId: populated.senderId._id,
          sender: {
            _id: populated.senderId._id,
            fullName: populated.senderId.fullName || "",
            email: populated.senderId.email || "",
          },
          text: msg.text,
          createdAt: msg.createdAt,
        });
      } catch (e) {
        socket.emit("chat_error", "Failed to send message");
      }
    });
  });

  return io;
}

module.exports = { initGuardianChat };
