const { Queue } = require('bullmq');

const notificationQueue = new Queue('notifications', {
  connection: {
    url: process.env.UPSTASH_REDIS_URL
  }
});

console.log('Queue connecting to Redis:', process.env.UPSTASH_REDIS_URL);

module.exports = notificationQueue;