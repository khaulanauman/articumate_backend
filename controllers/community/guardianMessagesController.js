const GuardianMessage = require("../../models/community/guardianMessage");
const GuardianGroup = require("../../models/community/guardianGroup");

// GET /api/guardian/groups/:id/messages?limit=50&before=ISO
exports.getMessages = async (req, res, next) => {
  function shapeMessage(doc) {
    const o = doc.toObject ? doc.toObject() : doc;
    const sender = o.senderId || {};
    return {
      _id: o._id,
      groupId: o.groupId,                 // add this for client convenience
      text: o.text,
      createdAt: o.createdAt,
      senderId: sender._id || sender,     // keep a flat senderId too
      sender: {                           // and the rich sender object
        _id: sender._id || sender,
        fullName: sender.fullName || "",
        email: sender.email || "",
      },
    };
  }

  try {
    const { id: groupId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);
    const before = req.query.before ? new Date(req.query.before) : null;

    const g = await GuardianGroup.findById(groupId);
    if (!g) return res.status(404).json({ message: "Group not found" });
    if (!g.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Not a member" });
    }

    const q = { groupId };
    if (before) q.createdAt = { $lt: before };

    const items = await GuardianMessage.find(q)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("senderId", "fullName email");

    res.json(items.reverse().map(shapeMessage));
  } catch (e) { next(e); }
};

