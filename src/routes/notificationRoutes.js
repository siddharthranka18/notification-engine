const express = require('express');
const router = express.Router();
const notificationQueue = require('../queues/notificationQueue');
const Notification = require('../models/Notifications');

router.post('/send', async (req, res) => {
  const { recipient, message, type } = req.body;

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
  });

  res.json({ success: true, message: 'Notification queued successfully', id: notification._id });
});

router.get('/history', async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 });
  res.json(notifications);
});

module.exports = router;