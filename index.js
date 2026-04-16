const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
console.log('Redis URL:', process.env.UPSTASH_REDIS_URL);

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(express.json());

require('./src/workers/notificationWorker')(io); //passing socket instance to worker 

const notificationRoutes = require('./src/routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('mongoDB connected'))
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