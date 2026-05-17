const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { sendEmail } = require('../services/emailServices');
const { sendSMS } = require('../services/smsService');
const Notification = require('../models/Notifications');

module.exports = (io) => {
  const connection = new Redis(process.env.UPSTASH_REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  console.log('Worker connecting to Redis:', process.env.UPSTASH_REDIS_URL);

  const worker = new Worker('notifications', async (job) => {
    console.log('processing job:', job.id);
    const { recipient, message, type, notificationId } = job.data;

    try {
      if (type === 'email') {
        await sendEmail(recipient, message);
      } else if (type === 'sms') {
        await sendSMS(recipient, message);
      }

      await Notification.findByIdAndUpdate(notificationId, {
        status: 'sent'
      });

      io.emit('notification', {
        status: 'delivered',
        type,
        recipient,
        message
      });

    } catch (err) {
      await Notification.findByIdAndUpdate(notificationId, {
        status: 'failed',
        error: err.message,
        retryCount: job.attemptsMade
      });
      throw err;
    }

  }, { connection });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.log(`${job.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.log('Worker error:', err.message);
  });

  return worker;
};