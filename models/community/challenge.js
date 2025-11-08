const { Schema, model } = require("mongoose");

const ChallengeSchema = new Schema(
  {
    title: { type: String, required: true },           // e.g., "Rabbit"
    task: { type: String, required: true },            // e.g., "Record 3 times"
    targetCount: { type: Number, default: 3 },
    rewardStars: { type: Number, default: 5 },
    icon: { type: String, default: "mic" },

    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    memberCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = model("Challenge", ChallengeSchema);
