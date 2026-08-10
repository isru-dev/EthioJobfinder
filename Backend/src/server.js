import dotenv from 'dotenv';
import express from 'express';
import { connectDB } from './utils/db.js';
dotenv.config();

const app = express();

app.get('/', (req, res) => {
  console.log('ui');
  res.send('OK');
});

const PORT = process.env.PORT || 5000;

await connectDB();
console.log("database connected");

app.listen(PORT, () => {

  console.log(`server running on port ${PORT}`);
});

