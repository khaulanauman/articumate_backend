const GuardianPost = require("../models/community/guardianPost");

// POST /api/guardian/feed
exports.createPost = async (req, res, next) => {
  try {
    const { text } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ message: "Text required" });

    const post = await GuardianPost.create({
      authorId: req.user._id,
      text: text.trim(),
    });
    res.status(201).json(post);
  } catch (e) { next(e); }
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
    const nextCursor = hasMore ? sliced[sliced.length - 1].createdAt.toISOString() : null;

    res.json({ items: sliced, nextCursor });
  } catch (e) { next(e); }
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
    res.json({ likesCount: doc.likes.length });
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
    res.json({ likesCount: doc.likes.length });
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
    res.json({ savesCount: doc.saves.length });
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
    res.json({ savesCount: doc.saves.length });
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
    res.json({ flagsCount: doc.flags.length });
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
    res.status(204).end();
  } catch (e) { next(e); }
};
