
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns';

dotenv.config();

// Use Google DNS for MongoDB Atlas SRV lookups.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing from server/.env');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
};

export default connectDB;
