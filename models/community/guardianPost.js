const { Schema, model } = require('mongoose');

const GuardianPostSchema = new Schema({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text:     { type: String, required: true, maxlength: 2000 },

  likes:    [{ type: Schema.Types.ObjectId, ref: 'User' }],
  saves:    [{ type: Schema.Types.ObjectId, ref: 'User' }],
  flags:    [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

GuardianPostSchema.index({ createdAt: -1 });

module.exports = model('GuardianPost', GuardianPostSchema);
