const express=require('express');
const router = express.Router();
const notificationQueue=require('../queues/notificationQueue');//enrtry point for redis 
router.post('/send',async(req,res)=>{
    const {recipient,message,type}=req.body;
    await notificationQueue.add('send-notification',{
        recipient,
        message,
        type
    });

    res.json({success:true,message:"notification sent successfully"});
});
module.exports=router;
