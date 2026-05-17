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

  const worker = new Worker('notifications', async (job) => {
    console.log('processing job:', job.id);
    console.log('job data:', JSON.stringify(job.data));
    
    const { recipient, message, type, notificationId } = job.data;

    try {
      console.log('sending', type, 'to', recipient);
      
      if (type === 'email') {
        await sendEmail(recipient, message);
        console.log('email sent successfully');
      } else if (type === 'sms') {
        await sendSMS(recipient, message);
        console.log('sms sent successfully');
      }

      console.log('updating notification status');
      await Notification.findByIdAndUpdate(notificationId, { status: 'sent' });
      console.log('status updated');

      io.emit('notification', { status: 'delivered', type, recipient, message });

    } catch (err) {
      console.log('ERROR in job:', err.message);
      console.log('ERROR stack:', err.stack);
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
    console.log(`Job ${job.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.log('Worker error:', err.message);
  });

  return worker;
};