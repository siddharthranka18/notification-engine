const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
console.log('Redis URL:', process.env.UPSTASH_REDIS_URL);

process.on('unhandledRejection', (reason) => {
  console.log('Unhandled Rejection:', reason);
});

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(express.json());

const notificationRoutes = require('./src/routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('mongoDB connected');
    require('./src/workers/notificationWorker')(io);
    console.log('Worker started');

    const notificationQueue = require('./src/queues/notificationQueue');
    const Notification = require('./src/models/Notifications');

    const notification = await Notification.create({
      recipient: 'siddharthranka91@gmail.com',
      message: 'Test job on startup',
      type: 'email',
      status: 'pending'
    });

    await notificationQueue.add('send-notification', {
      recipient: 'siddharthranka91@gmail.com',
      message: 'Test job on startup',
      type: 'email',
      notificationId: notification._id
    });

    console.log('Test job added');
  })
  .catch((err) => console.log("mongoDB error :", err));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

httpServer.listen(process.env.PORT, () => {
  console.log(`server running on port ${process.env.PORT}`);
});