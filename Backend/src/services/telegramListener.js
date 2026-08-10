import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import { Job } from "../models/Job.js";
import { generateRawHash } from "../utils/hash.js";
import dotenv from "dotenv";

dotenv.config();

const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
const apiHash = process.env.TELEGRAM_API_HASH;
const sessionString = process.env.TELEGRAM_SESSION_STRING;

const MONITORED_CHANNELS = [
  "effoyjobs",
  "jobs_in_ethio",
  "hahujobs_bot",
  "freelance_ethio",
];

export const initTelegramListener = async () => {
  if (!sessionString) {
    console.error("❌ TELEGRAM_SESSION_STRING is missing in .env!");
    return;
  }

  const stringSession = new StringSession(sessionString);
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  console.log("⚡ GramJS Listener Active!");

  client.addEventHandler(async (event) => {
    const message = event.message;
    if (!message || !message.text) return;

    const rawText = message.text;
    const rawHash = generateRawHash(rawText);

    try {
      // 1. Check if job post already exists in DB
      const existingJob = await Job.findOne({ rawHash });
      if (existingJob) {
        console.log("⚠️ Duplicate job post detected. Skipping save.");
        return;
      }

      // 2. Save new job to MongoDB
      const newJob = await Job.create({
        rawHash,
        rawText,
        title: "New Channel Post", // Temporary placeholder before parsing
        sourceName: "Telegram Channel",
      });

      console.log(`✅ Saved new job to MongoDB! ID: ${newJob._id}`);
    } catch (err) {
      console.error("❌ Error saving post to DB:", err.message);
    }
  }, new NewMessage({ chats: MONITORED_CHANNELS }));
};