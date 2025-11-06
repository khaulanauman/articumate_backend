const router = require("express").Router();
const requireAuth = require("../../middleware/requireAuth");
const { verifyGuardianCode } = require("../../controllers/community/guardianAccessController");

router.post("/verify", requireAuth, verifyGuardianCode); // POST /api/guardian/access/verify

module.exports = router;
