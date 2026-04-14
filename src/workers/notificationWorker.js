const {Worker} = require('bullmq');
require('dotenv').config();
const {sendEmail}=require('../services/emailServices');
const {sendSMS}=require('../services/smsService');
const  connection ={
    url:process.env.UPSTASH_REDIS_URL
};
const worker = new Worker('notifications',async(job)=>{
    console.log('processing job:',job.id);
const  {recipient,message,type}=job.data;
if(type=='email'){
    await sendEmail(recipient,message);
}else if(type=='sms'){
    await sendSMS(recipient,message);
}
},{
connection,
attempts:3,
backoff:{
    type:'exponential',
    delay:1000
}
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});


worker.on('failed',(job,err)=>{
    console.log(`${job.id} failed:`,err.message);
})
module.exports=worker;