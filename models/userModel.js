const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["guardian", "therapist", "admin", "child"],
      default: "guardian",
    },
    avatar: { type: String, default: "" },
    stars: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    guardianName: {
      type: String,
      required: true,
      trim: true,
    },
    guardianEmail: {
      type: String,
      required: true,
      trim: true,
    },
    ageGroup: {
      type: Number,
      required: true,
    },
    guardianAccessCode: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
