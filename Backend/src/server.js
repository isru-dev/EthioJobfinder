import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();

app.get('/', (req, res) => {
  console.log('ui');
  res.send('OK');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

