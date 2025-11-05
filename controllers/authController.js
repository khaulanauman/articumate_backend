const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

exports.signup = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      guardianName,
      guardianEmail,
      ageGroup,
      guardianAccessCode,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !password ||
      !guardianName ||
      !guardianEmail ||
      ageGroup === undefined ||
      !guardianAccessCode
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password and guardian access code
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAccessCode = await bcrypt.hash(guardianAccessCode, 10);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role,
      guardianName,
      guardianEmail,
      ageGroup,
      guardianAccessCode: hashedAccessCode,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
};
