import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection.db;
const counts = {
  users: await db.collection('users').countDocuments(),
  patients: await db.collection('patients').countDocuments(),
  doctors: await db.collection('doctors').countDocuments(),
  appointments: await db.collection('appointments').countDocuments()
};

const users = await db.collection('users').find({}).limit(10).toArray();

console.log(JSON.stringify({ counts, users }, null, 2));

await mongoose.disconnect();
