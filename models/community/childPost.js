const { Schema, model, Types } = require("mongoose");

const ChildPostSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 200 },
    likes: [{ type: Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

ChildPostSchema.index({ createdAt: -1 });
module.exports = model("ChildPost", ChildPostSchema);
