const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

exports.verifyGuardianCode = async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code || String(code).length !== 4) {
      return res.status(400).json({ message: "4-digit code required" });
    }

    const user = await User.findById(req.user._id).select("guardianAccessCode fullName");
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(String(code), user.guardianAccessCode);
    if (!ok) return res.status(401).json({ message: "Invalid access code" });

    // MVP: just confirm success. (Optionally issue a short-lived “guardian gate” JWT here)
    return res.status(204).send();
  } catch (e) {
    console.error("verifyGuardianCode error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};
