const router = require("express").Router();
const ctrl = require("../../controllers/community/challengesController");

router.get("/", ctrl.listActive);
router.get("/:id/summary", ctrl.summary);
router.get("/:id/leaderboard", ctrl.leaderboardForChallenge);
router.post("/:id/join", ctrl.join);
router.post("/:id/record", ctrl.recordAttempt);
router.get("/leaderboard/top", ctrl.leaderboard);

module.exports = router;
