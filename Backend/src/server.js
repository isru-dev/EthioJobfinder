import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {connectDB} from "./config/db.js";
import { initTelegramListener } from "./services/telegramListener.js";
import jobRoutes from './routes/jobRoutes.js'
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.use("/api/v1/jobs", jobRoutes);

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