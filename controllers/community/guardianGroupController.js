const GuardianGroup = require("../../models/community/guradianGroup");

// helper – normalize a group doc to the shape the app expects
function shapeGroup(doc, meId, withMembers = false) {
  const o = doc.toObject ? doc.toObject() : doc;
  const joined = Array.isArray(o.members)
    ? o.members.some(m => m.toString() === meId.toString() || (m._id && m._id.toString() === meId.toString()))
    : false;

  const base = {
    _id: o._id,
    name: o.name,
    description: o.description || "",
    membersCount: (o.members || []).length,
    joined,
  };

  if (withMembers) {
    base.admin = o.createdBy
      ? { _id: o.createdBy._id, fullName: o.createdBy.fullName, email: o.createdBy.email }
      : null;

    base.members = (o.members || []).map(m =>
      (m && m._id)
        ? { _id: m._id, fullName: m.fullName, email: m.email }
        : { _id: m, fullName: "", email: "" }
    );
  }

  return base;
}

// POST /api/guardian/groups
exports.createGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name required" });
    }

    const g = await GuardianGroup.create({
      name: name.trim(),
      description: (description || "").trim(),
      createdBy: req.user._id,
      members: [req.user._id],
    });

    // populate for uniform response
    const populated = await GuardianGroup.findById(g._id)
      .populate("createdBy", "fullName email")
      .populate("members", "fullName email");

    return res.status(201).json(shapeGroup(populated, req.user._id, true)); // object
  } catch (e) {
    next(e);
  }
};

// GET /api/guardian/groups?search=
exports.listGroups = async (req, res, next) => {
  try {
    const search = (req.query.search || "").trim();
    const q = search ? { name: { $regex: search, $options: "i" } } : {};
    const groups = await GuardianGroup.find(q)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(); // for list we keep it light (no populate)

    const shaped = groups.map(g => shapeGroup(g, req.user._id, false));
    return res.status(200).json(shaped); // array
  } catch (e) {
    next(e);
  }
};

// GET /api/guardian/groups/:id
exports.getGroupDetails = async (req, res, next) => {
  try {
    const g = await GuardianGroup.findById(req.params.id)
      .populate("createdBy", "fullName email")
      .populate("members", "fullName email");

    if (!g) return res.status(404).json({ message: "Not found" });
    return res.status(200).json(shapeGroup(g, req.user._id, true)); // object with admin + members
  } catch (e) {
    next(e);
  }
};

// POST /api/guardian/groups/:id/join
exports.joinGroup = async (req, res, next) => {
  try {
    const g = await GuardianGroup.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: req.user._id } },
      { new: true }
    ).lean();
    if (!g) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ members: g.members.length, joined: true }); // small JSON ok
  } catch (e) {
    next(e);
  }
};

// POST /api/guardian/groups/:id/leave
exports.leaveGroup = async (req, res, next) => {
  try {
    const g = await GuardianGroup.findById(req.params.id);
    if (!g) return res.status(404).json({ message: "Not found" });

    if (g.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Owner cannot leave own group" });
    }
    await GuardianGroup.updateOne(
      { _id: req.params.id },
      { $pull: { members: req.user._id } }
    );
    const fresh = await GuardianGroup.findById(req.params.id).lean();
    return res.status(200).json({ members: fresh.members.length, joined: false });
  } catch (e) {
    next(e);
  }
};