const { Schema, model, Types } = require("mongoose");

const ChallengeProgressSchema = new Schema(
  {
    challengeId: { type: Types.ObjectId, ref: "Challenge", required: true, index: true },
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    count: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    pointsEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ChallengeProgressSchema.index({ challengeId: 1, userId: 1 }, { unique: true });
module.exports = model("ChallengeProgress", ChallengeProgressSchema);
