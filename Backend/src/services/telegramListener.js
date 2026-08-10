import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import { Job } from "../models/Job.js";
import { generateRawHash } from "../utils/hash.js";
import { parseRawJobText } from "./parser.js";
import dotenv from "dotenv";

dotenv.config();

const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
const apiHash = process.env.TELEGRAM_API_HASH;
const sessionString = process.env.TELEGRAM_SESSION_STRING;

const MONITORED_CHANNELS = [
  "effoyjobs",
  "freelance_ethio",
  "hahujobsforfreshgraduates",
  "jobs_in_ethio",
];

// Helper to backfill past 7 days of messages
const backfillPast7Days = async (client) => {
  const sevenDaysAgoSeconds = Math.floor(
    (Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000,
  );
  console.log("⏳ Syncing job posts from the last 7 days...");

  let totalImported = 0;

  for (const channelUsername of MONITORED_CHANNELS) {
    try {
      console.log(`📥 Fetching recent history from @${channelUsername}...`);

      // Fetch up to 100 recent messages from the channel
      const messages = await client.getMessages(channelUsername, {
        limit: 100,
      });

      for (const msg of messages) {
        // Skip non-text or messages older than 7 days
        if (!msg || !msg.text || msg.date < sevenDaysAgoSeconds) continue;

        const rawText = msg.text;
        const rawHash = generateRawHash(rawText);

        if (!rawHash) continue;

        // Check for duplicate post
        const existingJob = await Job.findOne({ rawHash });
        if (!existingJob) {
          // Parse raw text into structured fields
          const parsedData = parseRawJobText(rawText);

          await Job.create({
            rawHash,
            rawText,
            ...parsedData,
            sourceName: `@${channelUsername}`,
            createdAt: new Date(msg.date * 1000), // Retain original post date
          });
          totalImported++;
        }
      }
    } catch (err) {
      console.error(
        `⚠️ Could not fetch history for @${channelUsername}:`,
        err.message,
      );
    }
  }

  console.log(
    `✅ Backfill complete! Loaded and parsed ${totalImported} new jobs from the past 7 days.`,
  );
};

export const initTelegramListener = async () => {
  if (!sessionString) {
    console.error("❌ TELEGRAM_SESSION_STRING is missing in .env!");
    return;
  }

  const stringSession = new StringSession(sessionString);
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log("🔄 Connecting GramJS Client...");
  await client.connect();
  console.log("⚡ Connected to Telegram MTProto!");

  // Step 1: Run 7-day backfill on startup
  await backfillPast7Days(client);

  // Step 2: Listen for live real-time posts going forward
  client.addEventHandler(
    async (event) => {
      const message = event.message;
      if (!message || !message.text) return;

      const rawText = message.text;
      const rawHash = generateRawHash(rawText);

      try {
        const existingJob = await Job.findOne({ rawHash });
        if (existingJob) return;

        // Parse raw live post
        const parsedData = parseRawJobText(rawText);

        const newJob = await Job.create({
          rawHash,
          rawText,
          ...parsedData,
          sourceName: "Telegram Live Stream",
        });

        console.log(`📩 New Live Job Parsed & Saved! Title: "${newJob.title}" | ID: ${newJob._id}`);
      } catch (err) {
        console.error("❌ Live Stream Save Error:", err.message);
      }
    },
    new NewMessage({ chats: MONITORED_CHANNELS }),
  );

  console.log(
    `🎧 Live listener actively monitoring: ${MONITORED_CHANNELS.join(", ")}`,
  );
};