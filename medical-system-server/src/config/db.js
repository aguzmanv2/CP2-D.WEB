import mongoose from 'mongoose';

export const connectDB = async () => {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    console.warn('MONGODB_URI is not defined. Database connection skipped.');
    return;
  }

  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');
};

