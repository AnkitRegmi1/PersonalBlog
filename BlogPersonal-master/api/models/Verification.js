const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const VerificationSchema = new Schema({
  email: { type: String, required: true, index: true, unique: true },
  username: { type: String, required: true },
  passwordHash: { type: String, required: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = model('Verification', VerificationSchema);


