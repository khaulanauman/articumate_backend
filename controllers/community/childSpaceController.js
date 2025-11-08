const User = require("../../models/userModel");
const ChildPost = require("../../models/community/childPost");

function shapePost(p, meId) {
  return {
    _id: p._id,
    text: p.text,
    createdAt: p.createdAt,
    likesCount: (p.likes || []).length,
    liked: (p.likes || []).some((id) => String(id) === String(meId)),
    author: p.userId
      ? { _id: p.userId._id || p.userId, name: p.userId.fullName || "", avatar: p.userId.avatar || "" }
      : null,
  };
}

exports.childSpaceHome = async (req, res) => {
  const meId = req.user && req.user._id ? req.user._id : req.userId; // whichever your auth sets
  const me = await User.findById(meId).lean();

  const friends = await User.find({ _id: { $ne: meId } })
    .sort({ stars: -1 })
    .limit(10)
    .select("_id fullName avatar stars")
    .lean();

  const posts = await ChildPost.find({})
    .sort({ createdAt: -1 })
    .limit(30)
    .populate("userId", "_id fullName avatar")
    .lean();

  res.json({
    me: me
      ? { _id: me._id, fullName: me.fullName, avatar: me.avatar || "", stars: me.stars || 0, level: me.level || 1 }
      : null,
    friends,
    posts: posts.map((p) => shapePost(p, meId)),
  });
};

exports.createChildPost = async (req, res) => {
  const meId = req.user && req.user._id ? req.user._id : req.userId;
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: "Text required" });

  const post = await ChildPost.create({ userId: meId, text: text.trim(), likes: [] });
  res.status(201).json(shapePost(await post.populate("userId", "_id fullName avatar"), meId));
};

exports.toggleLike = async (req, res) => {
  const meId = req.user && req.user._id ? req.user._id : req.userId;
  const post = await ChildPost.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Not found" });

  const i = post.likes.findIndex((u) => String(u) === String(meId));
  if (i >= 0) post.likes.splice(i, 1);
  else post.likes.push(meId);

  await post.save();
  res.json({ likesCount: post.likes.length, liked: i < 0 });
};
