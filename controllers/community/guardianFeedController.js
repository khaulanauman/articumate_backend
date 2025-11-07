const GuardianPost = require("../../models/community/guardianPost");

// helper → normalize to the exact shape the app expects
function shape(post, me, isAdmin = false) {
  const p = post.toObject ? post.toObject() : post;

  const likes = p.likes || [];
  const saves = p.saves || [];
  const flags = p.flags || [];

  // authorId may be an ObjectId or a populated doc
  const authorIdStr = (p.authorId && p.authorId._id ? p.authorId._id : p.authorId)?.toString?.() || "";
  const meStr = me?.toString?.() || "";

  const isOwner = authorIdStr === meStr;

  return {
    _id: p._id,
    text: p.text,
    createdAt: p.createdAt,
    author: p.authorId
      ? {
          _id: p.authorId._id || p.authorId,
          fullName: p.authorId.fullName || "",
          email: p.authorId.email || "",
        }
      : null,
    likesCount: likes.length,
    savesCount: saves.length,
    flagsCount: flags.length,
    liked: likes.some(id => id.toString() === meStr),
    saved: saves.some(id => id.toString() === meStr),
    flagged: flags.some(id => id.toString() === meStr),
    canDelete: isOwner || isAdmin,
  };
}

// POST /api/guardian/feed
exports.createPost = async (req, res, next) => {
  try {
    const { text } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text required" });
    }

    const post = await GuardianPost.create({
      authorId: req.user._id,
      text: text.trim(),
    });

    const populated = await GuardianPost.findById(post._id)
      .populate("authorId", "fullName email");

    return res
      .status(201)
      .json(shape(populated, req.user._id, req.user.role === "admin"));
  } catch (e) {
    next(e);
  }
};

// GET /api/guardian/feed?cursor=&limit=
exports.listPosts = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 50);
    const cursor = req.query.cursor;
    const q = {};
    if (cursor) q.createdAt = { $lt: new Date(cursor) };

    const items = await GuardianPost.find(q)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("authorId", "fullName email");

    const hasMore = items.length > limit;
    const sliced = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore
      ? sliced[sliced.length - 1].createdAt.toISOString()
      : null;

    return res.status(200).json({
      items: sliced.map(p => shape(p, req.user._id, req.user.role === "admin")),
      nextCursor,
    });
  } catch (e) {
    next(e);
  }
};

// POST /api/guardian/feed/:id/like
exports.likePost = async (req, res, next) => {
  try {
    const doc = await GuardianPost.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { likes: req.user._id } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ likesCount: doc.likes.length, liked: true });
  } catch (e) { next(e); }
};

// DELETE /api/guardian/feed/:id/like
exports.unlikePost = async (req, res, next) => {
  try {
    const doc = await GuardianPost.findByIdAndUpdate(
      req.params.id,
      { $pull: { likes: req.user._id } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ likesCount: doc.likes.length, liked: false });
  } catch (e) { next(e); }
};

// POST /api/guardian/feed/:id/save
exports.savePost = async (req, res, next) => {
  try {
    const doc = await GuardianPost.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { saves: req.user._id } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ savesCount: doc.saves.length, saved: true });
  } catch (e) { next(e); }
};

// DELETE /api/guardian/feed/:id/save
exports.unsavePost = async (req, res, next) => {
  try {
    const doc = await GuardianPost.findByIdAndUpdate(
      req.params.id,
      { $pull: { saves: req.user._id } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ savesCount: doc.saves.length, saved: false });
  } catch (e) { next(e); }
};

// POST /api/guardian/feed/:id/flag
exports.flagPost = async (req, res, next) => {
  try {
    const doc = await GuardianPost.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { flags: req.user._id } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ flagsCount: doc.flags.length, flagged: true });
  } catch (e) { next(e); }
};

// DELETE /api/guardian/feed/:id
exports.deletePost = async (req, res, next) => {
  try {
    const post = await GuardianPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Not found" });

    const isOwner = post.authorId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

    await post.deleteOne();
    return res.sendStatus(204);
  } catch (e) { next(e); }
};
