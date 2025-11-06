// controllers/loginController.js
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Compare passwords
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // 3. Login successful
    res.status(200).json({
      message: "Login successful",
      user: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        guardianName: existingUser.guardianName,
        guardianEmail: existingUser.guardianEmail,
        guardianCode: existingUser.guardianCode,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};
