const router = require("express").Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const groups = require("../controllers/community/guardianGroupController");
const msgs = require("../controllers/community/guardianMessagesController");

router.use(requireAuth, requireRole("guardian"));

// groups
router.post("/groups", groups.createGroup);
router.get("/groups", groups.listGroups);
router.post("/groups/:id/join", groups.joinGroup);
router.post("/groups/:id/leave", groups.leaveGroup);

// chat history
router.get("/groups/:id/messages", msgs.getMessages);

module.exports = router;
