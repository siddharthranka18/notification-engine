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

      console.log('Emitting delivered event, connected clients:', io.engine.clientsCount);
      io.emit('notification', { status: 'delivered', type, recipient, message });
      console.log('Delivered emit done');

    } catch (err) {
      console.log('ERROR in job:', err.message);
      console.log('ERROR stack:', err.stack);

      // Detect permanent errors that should NOT be retried
      const isPermanentError = 
        err.message?.includes('unverified') ||       // Twilio unverified number
        err.message?.includes('Invalid phone') ||    // bad phone format
        err.message?.includes('not a valid email');  // bad email format

      const isLastAttempt = job.attemptsMade >= job.opts.attempts - 1;

      if (isPermanentError || isLastAttempt) {
        // Update MongoDB only when permanently failing (not on intermediate retries)
        await Notification.findByIdAndUpdate(notificationId, {
          status: 'failed',
          error: err.message,
          retryCount: job.attemptsMade
        });

        // Emit failure to live feed
        console.log('Emitting failed event, connected clients:', io.engine.clientsCount);
        io.emit('notification', { status: 'failed', type, recipient, message, error: err.message });
        console.log('Failed emit done');
      }

      if (isPermanentError) {
        // Don't re-throw — BullMQ won't retry this job
        console.log('Permanent error detected — skipping retries for job:', job.id);
        return;
      }

      throw err; // re-throw so BullMQ retries with exponential backoff
    }

  }, { connection, concurrency: 10 });

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