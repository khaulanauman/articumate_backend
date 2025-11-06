const router = require("express").Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const c = require("../controllers/community/guardianFeedController");

router.use(requireAuth, requireRole("guardian"));

router.post("/feed", c.createPost);
router.get("/feed", c.listPosts);

router.post("/feed/:id/like", c.likePost);
router.delete("/feed/:id/like", c.unlikePost);

router.post("/feed/:id/save", c.savePost);
router.delete("/feed/:id/save", c.unsavePost);

router.post("/feed/:id/flag", c.flagPost);
router.delete("/feed/:id", c.deletePost);

module.exports = router;
