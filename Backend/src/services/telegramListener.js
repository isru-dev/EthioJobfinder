import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import { Job } from "../models/Job.js";
import { generateRawHash } from "../utils/hash.js";
import { 
  parseJobWithMultiAIFallback, 
  isLikelyJobPost 
} from "./parser.js";
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

// Helper: Breaks an array into chunked sub-arrays (e.g., batches of 5)
const chunkArray = (arr, size) => 
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

// Helper: Saves extracted jobs array safely to MongoDB
const saveJobsToDatabase = async (parsedResult, rawText, rawHash, sourceName, date) => {
  if (!parsedResult || !Array.isArray(parsedResult.jobs)) return 0;

  let savedCount = 0;

  for (let i = 0; i < parsedResult.jobs.length; i++) {
    const jobItem = parsedResult.jobs[i];
    // Create unique hash index if one message contains multiple job vacancies
    const uniqueHash = parsedResult.jobs.length > 1 ? `${rawHash}_pos_${i}` : rawHash;

    const existingJob = await Job.findOne({ rawHash: uniqueHash });
    if (!existingJob) {
      await Job.create({
        rawHash: uniqueHash,
        rawText,
        title: jobItem.title,
        company: jobItem.company,
        category: jobItem.category,
        tags: jobItem.tags,
        contactEmail: jobItem.contactEmail,
        contactPhone: jobItem.contactPhone,
        sourceName,
        createdAt: date ? new Date(date * 1000) : new Date(),
      });
      savedCount++;
    }
  }

  return savedCount;
};

// Fast Parallel Backfill
const backfillPast7Days = async (client) => {
  const sevenDaysAgoSeconds = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
  console.log("⏳ Starting fast parallel backfill (Past 7 Days)...");

  let totalImported = 0;

  for (const channelUsername of MONITORED_CHANNELS) {
    try {
      console.log(`📥 Fetching history from @${channelUsername}...`);
      const messages = await client.getMessages(channelUsername, { limit: 100 });

      // Step 1: Pre-filter valid job messages
      const validMessages = messages.filter(
        (msg) => msg && msg.text && msg.date >= sevenDaysAgoSeconds && isLikelyJobPost(msg.text)
      );

      // Step 2: Split into parallel processing chunks of 5
      const messageChunks = chunkArray(validMessages, 5);

      for (const chunk of messageChunks) {
        await Promise.all(
          chunk.map(async (msg) => {
            const rawText = msg.text;
            const rawHash = generateRawHash(rawText);
            if (!rawHash) return;

            // Run Multi-AI parsing
            const parsedResult = await parseJobWithMultiAIFallback(rawText);

            // Save to MongoDB
            const count = await saveJobsToDatabase(
              parsedResult,
              rawText,
              rawHash,
              `@${channelUsername}`,
              msg.date
            );
            totalImported += count;
          })
        );

        // Small 300ms pause between chunks to keep within API rate limits
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch (err) {
      console.error(`⚠️ Error fetching history for @${channelUsername}:`, err.message);
    }
  }

  console.log(`✅ Backfill complete! Integrated ${totalImported} new jobs.`);
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

  // Run initial backfill asynchronously in the background
  backfillPast7Days(client);

  // Real-Time Live Message Listener
  client.addEventHandler(
    async (event) => {
      const message = event.message;
      if (!message || !message.text) return;

      const rawText = message.text;

      // Fast Local Pre-Filter
      if (!isLikelyJobPost(rawText)) return;

      const rawHash = generateRawHash(rawText);
      try {
        const parsedResult = await parseJobWithMultiAIFallback(rawText);
        await saveJobsToDatabase(
          parsedResult,
          rawText,
          rawHash,
          "Telegram Live Stream",
          message.date
        );
        console.log(`📩 New Live Job Parsed & Saved! Text snippet: "${rawText.slice(0, 40)}..."`);
      } catch (err) {
        console.error("❌ Live Stream Save Error:", err.message);
      }
    },
    new NewMessage({ chats: MONITORED_CHANNELS })
  );

  console.log(`🎧 Live listener active for channels: ${MONITORED_CHANNELS.join(", ")}`);
};