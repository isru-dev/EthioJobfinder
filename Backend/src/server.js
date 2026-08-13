import express from "express";
import dotenv from "dotenv";

dotenv.config();

import cors from "cors";
import {connectDB} from "./config/db.js";
import { initTelegramListener } from "./services/telegramListener.js";
import jobRoutes from './routes/jobRoutes.js';
import auth from './routes/auth.js';
import userRoutes from './routes/user.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
// Add this in your main server file

app.use("/api/v1/jobs", jobRoutes);
app.use("/api/auth", auth);
app.use("/api/user", userRoutes);
const startApp = async () => {
  // 1. Connect to Database
  await connectDB();

  // 2. Start Express HTTP Server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  // 3. Start GramJS Telegram Listener
  await initTelegramListener();
};

startApp();