.then(async () => {
    console.log('mongoDB connected');
    require('./src/workers/notificationWorker')(io);
    console.log('Worker started');
    
    // Test job
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