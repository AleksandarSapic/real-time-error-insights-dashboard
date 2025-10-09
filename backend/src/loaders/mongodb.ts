import mongoose from 'mongoose';
import config from '../config';

const buildMongoURI = (): string => {
  const { host, port, database, username, password } = config.mongo;

  if (username && password) {
    return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
  }

  return `mongodb://${host}:${port}/${database}`;
};

export const connectMongoDB = async (): Promise<typeof mongoose> => {
  try {
    const mongoURI = buildMongoURI();
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
    return mongoose;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export const disconnectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
  }
};
