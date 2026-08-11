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
import { User } from "../models/User.js";
import { sendTelegramJobAlert } from "../services/notifier.js";
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



// Helper: Saves extracted jobs array safely to MongoDB & triggers user alerts
const saveJobsToDatabase = async ({
  parsedResult,
  rawText,
  rawHash,
  channelUsername,
  messageId,
  date,
}) => {
  if (!parsedResult || !Array.isArray(parsedResult.jobs)) return 0;

  let savedCount = 0;
  const cleanUsername = channelUsername ? channelUsername.replace("@", "") : null;
  
  // Construct direct Telegram link
  const postUrl = cleanUsername && messageId 
    ? `https://t.me/${cleanUsername}/${messageId}` 
    : cleanUsername 
    ? `https://t.me/${cleanUsername}` 
    : null;

  for (let i = 0; i < parsedResult.jobs.length; i++) {
    const jobItem = parsedResult.jobs[i];
    // Create unique hash index if one message contains multiple job vacancies
    const uniqueHash = parsedResult.jobs.length > 1 ? `${rawHash}_pos_${i}` : rawHash;

    const existingJob = await Job.findOne({ rawHash: uniqueHash });
    if (!existingJob) {
      const newJob = await Job.create({
        rawHash: uniqueHash,
        rawText,
        title: jobItem.title,
        company: jobItem.company,
        category: jobItem.category,
        tags: jobItem.tags,
        contactEmail: jobItem.contactEmail,
        contactPhone: jobItem.contactPhone,
        sourceName: cleanUsername ? `@${cleanUsername}` : "Telegram",
        sourceType: "telegram",
        messageId: messageId || null,
        channelUsername: cleanUsername ? `@${cleanUsername}` : null,
        postUrl,
        createdAt: date ? new Date(date * 1000) : new Date(),
      });
      savedCount++;

      // ----------------------------------------------------
      // DISPATCH REAL-TIME ALERTS TO SUBSCRIBED USERS
      // ----------------------------------------------------
      if (jobItem.category) {
        try {
          // Find all users who enabled notifications and opted into this category
          const matchingUsers = await User.find({
            notificationsEnabled: true,
            subscribedCategories: jobItem.category,
          });

          // Send message asynchronously (or run in parallel with Promise.allSettled)
          Promise.allSettled(
            matchingUsers.map((user) => sendTelegramJobAlert(user.telegramId, newJob))
          ).catch((err) =>
            console.error("Error sending user notifications:", err.message)
          );
        } catch (alertErr) {
          console.error("Notification query failed:", alertErr.message);
        }
      }
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

            // Save to MongoDB with postUrl & message ID
            const count = await saveJobsToDatabase({
              parsedResult,
              rawText,
              rawHash,
              channelUsername,
              messageId: msg.id,
              date: msg.date,
            });
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

      // Dynamically extract channel username from chat sender
      let channelUsername = null;
      try {
        const chat = await message.getChat();
        channelUsername = chat?.username || null;
      } catch (err) {
        console.warn("Could not extract chat entity for live event:", err.message);
      }

      try {
        const parsedResult = await parseJobWithMultiAIFallback(rawText);
        await saveJobsToDatabase({
          parsedResult,
          rawText,
          rawHash,
          channelUsername,
          messageId: message.id,
          date: message.date,
        });
        console.log(`📩 New Live Job Parsed & Saved! Link: https://t.me/${channelUsername}/${message.id}`);
      } catch (err) {
        console.error("❌ Live Stream Save Error:", err.message);
      }
    },
    new NewMessage({ chats: MONITORED_CHANNELS })
  );

  console.log(`🎧 Live listener active for channels: ${MONITORED_CHANNELS.join(", ")}`);
};