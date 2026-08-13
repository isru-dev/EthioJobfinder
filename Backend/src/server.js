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

const allowedOrigins = [
  "https://ethio-jobfinder.vercel.app",
  "http://localhost:3000", // keep for local frontend dev
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;

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