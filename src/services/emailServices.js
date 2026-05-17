const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (recipient, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipient,
    subject: 'New Notification',
    text: message
  };
  await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${recipient}`);
};

module.exports = { sendEmail };