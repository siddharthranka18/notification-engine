const express=require('express');
const mongoose=require('mongoose');
const dotenv=require('dotenv');
dotenv.config();
const app = express();
app.use(express.json());
const notificationRoutes=require('./src/routes/notificationRoutes');
app.use('/api/notifications',notificationRoutes);
mongoose.connect(process.env.MONGO_URI)
    .then(()=>console.log('mongoDB connected'))
    .catch((err)=>console.log("mongoDB error :",err));


app.get('/',(req,res)=>{
    res.json({message:"notification engine running"});
})

app.listen(process.env.PORT,()=>{
    console.log(`server running on port ${process.env.PORT}`);
});