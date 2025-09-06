const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const SubscriberSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
}, { timestamps: true });

module.exports = model('Subscriber', SubscriberSchema);


