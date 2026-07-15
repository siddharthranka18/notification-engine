const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const notificationQueue = new Queue('notifications', {
  connection,
  defaultJobOptions: {
    attempts: 5,                          // max 5 attempts before marking permanently failed
    backoff: {
      type: 'exponential',
      delay: 2000,                        // 2s → 4s → 8s → 16s → 32s
    },
    removeOnComplete: 100,                // keep last 100 completed jobs in Redis
    removeOnFail: 200,                    // keep last 200 failed jobs for inspection
  },
});

console.log('Queue connecting to Redis:', process.env.UPSTASH_REDIS_URL);

module.exports = notificationQueue;