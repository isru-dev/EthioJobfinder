import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import dotenv from "dotenv";

dotenv.config();

const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
const apiHash = process.env.TELEGRAM_API_HASH;
const sessionString = process.env.TELEGRAM_SESSION_STRING;

// Target channels to listen to (handles both username formats)
const MONITORED_CHANNELS = [
  "Ethio_Job_vacancy",
  "Jobs_in_ethio",
  "hahu_jobs",
  "geezjobs_ethiopia"
];

export const initTelegramListener = async () => {
  if (!sessionString) {
    console.error("❌ ERROR: TELEGRAM_SESSION_STRING is missing in .env! Run 'npm run telegram:auth' first.");
    return;
  }

  const stringSession = new StringSession(sessionString);
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log("🔄 Connecting to Telegram MTProto servers via GramJS...");
  await client.connect();
  console.log("⚡ GramJS Listener Active!");

  // Event listener for incoming posts
  client.addEventHandler(async (event) => {
    const message = event.message;

    // Ignore empty messages, service events, or non-text posts
    if (!message || !message.text) return;

    const rawText = message.text;
    const date = new Date(message.date * 1000);

    console.log("\n=================== 📩 NEW JOB POST CAUGHT ===================");
    console.log(`🕒 Time: ${date.toLocaleString()}`);
    console.log(`📄 Raw Text:\n${rawText.slice(0, 250)}...`);
    console.log("=============================================================\n");

    // Next step: Call MD5 hash deduplication utility & save job to MongoDB!

  }, new NewMessage({ chats: MONITORED_CHANNELS }));

  console.log(`🎧 Listening for updates on channels: ${MONITORED_CHANNELS.join(", ")}`);
};