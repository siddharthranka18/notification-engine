const {Queue}= require('bullmq');
require('dotenv').config();
const connection={
    url:process.env.UPSTASH_REDIS_URL
};

const notificationQueue=new Queue('notifications',{connection});
module.exports=notificationQueue;