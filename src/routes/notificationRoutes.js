const express = require('express');
const router = express.Router();
const notificationQueue = require('../queues/notificationQueue');
const Notification = require('../models/Notifications');

router.post('/send', async (req, res) => {
  const { recipient, message, type } = req.body;

  if (!recipient || !message || !['email', 'sms'].includes(type)) {
    return res.status(400).json({ error: 'recipient, message, and type (email|sms) are required' });
  }

  const notification = await Notification.create({
    recipient,
    message,
    type,
    status: 'pending'
  });

  await notificationQueue.add('send-notification', {
    recipient,
    message,
    type,
    notificationId: notification._id
  }, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
  });

  res.json({ success: true, message: 'Notification queued successfully', id: notification._id });
});

router.get('/history', async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 });
  res.json(notifications);
});

module.exports = router;