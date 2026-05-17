const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const notificationQueue = new Queue('notifications', { connection });

console.log('Queue connecting to Redis:', process.env.UPSTASH_REDIS_URL);

module.exports = notificationQueue;