const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const GuardianMessage = require("../models/community/guardianMessage");
const GuardianGroup = require("../models/community/guardianGroup");

function initGuardianChat(httpServer, corsOrigins = ["*"]) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigins, methods: ["GET", "POST"] },
  });

  // auth gate on connection
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));
      const user = jwt.verify(token, process.env.JWT_SECRET);
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
    // join a guardian group room
    socket.on("joinGroup", async (groupId) => {
      const g = await GuardianGroup.findById(groupId);
      if (!g) return socket.emit("error", "Group not found");
      const isMember = g.members.some(m => m.toString() === socket.user._id);
      if (!isMember) return socket.emit("error", "Not a member");
      socket.join(groupId);
      socket.emit("joined", { groupId });
    });

    // send a message
    socket.on("sendMessage", async ({ groupId, text }) => {
      if (!text || !text.trim()) return;
      const g = await GuardianGroup.findById(groupId);
      if (!g) return socket.emit("error", "Group not found");
      const isMember = g.members.some(m => m.toString() === socket.user._id);
      if (!isMember) return socket.emit("error", "Not a member");

      const msg = await GuardianMessage.create({
        groupId,
        senderId: socket.user._id,
        text: text.trim(),
      });

      io.to(groupId).emit("newMessage", {
        _id: msg._id,
        groupId,
        senderId: { _id: socket.user._id, fullName: socket.user.fullName }, // if in token
        text: msg.text,
        createdAt: msg.createdAt,
      });
    });
  });

  return io;
}

module.exports = { initGuardianChat };
