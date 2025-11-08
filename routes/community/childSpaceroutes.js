const router = require("express").Router();
const ctrl = require("../../controllers/community/childSpaceController");

// GET child-space home (me, friends, posts)
router.get("/child-space", ctrl.childSpaceHome);

// POST create a child post
router.post("/child-posts", ctrl.createChildPost);

// POST like/unlike a child post
router.post("/child-posts/:id/like", ctrl.toggleLike);

module.exports = router;
