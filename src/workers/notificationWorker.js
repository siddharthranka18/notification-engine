const {Worker} = require('bullmq');
require('dotenv').config();
const  connection ={
    url:process.env.UPSTASH_REDIS_URL
};
const worker = new Worker('notifications',async(job)=>{
    console.log('processing job:',job.id);
    console.log('job data:',job.data);
console.log(`notification sent to ${job.data.recipient}`);
},{connection});
worker.on('completed',(job)=>{
    console.log(`job ${job.id} completed successfully`);
})

worker.on('failed',(job,err)=>{
    console.log(`${job.id} failed:`,err.message);
})
module.exports=worker;