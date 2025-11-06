const GuardianGroup = require("../models/community/guardianGroup");

// POST /api/guardian/groups
exports.createGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ message: "Group name required" });

    const group = await GuardianGroup.create({
      name: name.trim(),
      description: description?.trim() || "",
      createdBy: req.user._id,
      members: [req.user._id],
    });
    res.status(201).json(group);
  } catch (e) { next(e); }
};

// GET /api/guardian/groups?search=
exports.listGroups = async (req, res, next) => {
  try {
    const search = (req.query.search || "").trim();
    const q = search ? { $text: { $search: search } } : {};
    const groups = await GuardianGroup.find(q).sort({ createdAt: -1 }).limit(100);
    const me = req.user._id.toString();
    const withJoined = groups.map(g => ({
      ...g.toObject(),
      joined: g.members.some(m => m.toString() === me),
      membersCount: g.members.length,
    }));
    res.json(withJoined);
  } catch (e) { next(e); }
};

// POST /api/guardian/groups/:id/join
exports.joinGroup = async (req, res, next) => {
  try {
    const g = await GuardianGroup.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: req.user._id } },
      { new: true }
    );
    if (!g) return res.status(404).json({ message: "Not found" });
    res.json({ members: g.members.length, joined: true });
  } catch (e) { next(e); }
};

// POST /api/guardian/groups/:id/leave
exports.leaveGroup = async (req, res, next) => {
  try {
    const g = await GuardianGroup.findById(req.params.id);
    if (!g) return res.status(404).json({ message: "Not found" });

    // prevent owner leaving without transfer/delete (simple rule)
    if (g.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Owner cannot leave own group" });
    }
    await GuardianGroup.findByIdAndUpdate(req.params.id, { $pull: { members: req.user._id } });
    const fresh = await GuardianGroup.findById(req.params.id);
    res.json({ members: fresh.members.length, joined: false });
  } catch (e) { next(e); }
};
