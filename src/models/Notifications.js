const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['email', 'sms'], required: true },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  retryCount: { type: Number, default: 0 },
  error: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);