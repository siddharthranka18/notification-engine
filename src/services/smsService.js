const twilio=require('twilio');
require('dotenv').config();
const client=twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);
const sendSMS=async(recipient,message)=>{
    await client.messages.create({
        body:message,
        from:process.env.TWILIO_PHONE_NUMBER,
        to:recipient
    });
    console.log(`sms sent to ${recipient}`);
};
module.exports={sendSMS};