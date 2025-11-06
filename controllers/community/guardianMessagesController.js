const GuardianMessage = require("../../models/community/guardianMessage");
const GuardianGroup = require("../../models/community/guradianGroup");

// GET /api/guardian/groups/:id/messages?limit=50&before=ISO
exports.getMessages = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);
    const before = req.query.before ? new Date(req.query.before) : null;

    // ensure caller is a member
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

    res.json(items.reverse());
  } catch (e) { next(e); }
};
