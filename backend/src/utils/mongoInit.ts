import { ErrorEventModel } from '../models/ErrorEventModel';

export const initializeMongoCollection = async (): Promise<void> => {
  try {
    await ErrorEventModel.createIndexes();
    console.log('MongoDB collection and indexes initialized successfully');
  } catch (error) {
    console.error('Error initializing MongoDB collection:', error);
    throw error;
  }
};
