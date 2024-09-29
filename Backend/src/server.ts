import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

import connectDB from './config/db';
import { log } from 'console';
import userRoute from './routes/userRoute';
import cors from 'cors'

dotenv.config();

connectDB()


const app = express();

app.use(express.json())

const corsOptions = {
    origin: 'https://stock-image-three.vercel.app', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.options('*', cors(corsOptions)); 

app.use(cors(corsOptions)); 



// Ensure headers are sent with each response
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://stock-image-three.vercel.app');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

const port = process.env.PORT || 5000;

app.use('/api/users' , userRoute)

app.listen(port, () => {
    log(`Server is running on the port ${port}`)
})





