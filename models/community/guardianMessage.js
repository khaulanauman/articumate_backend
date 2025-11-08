// models/community/guardianMessage.js
const { Schema, model } = require("mongoose");

const GuardianMessageSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "GuardianGroup",
      required: true,
      index: true,
    },

    // 👇 This should point to "Guardian", not "User",
    // because your token validation allows only guardians/admins.
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "Guardian",
      required: true,
      index: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// useful compound index for history queries
GuardianMessageSchema.index({ groupId: 1, createdAt: 1 });

module.exports = model("GuardianMessage", GuardianMessageSchema);
