const { Schema, model } = require("mongoose");

const GuardianGroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }], // guardians only
  },
  { timestamps: true }
);

GuardianGroupSchema.index({ name: "text", description: "text" });
GuardianGroupSchema.index({ createdAt: -1 });

module.exports = model("GuardianGroup", GuardianGroupSchema);
