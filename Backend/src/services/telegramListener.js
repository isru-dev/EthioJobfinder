import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import { Job } from "../models/Job.js";
import { generateRawHash } from "../utils/hash.js";
import { parseRawJobText } from "./parser.js";
import dotenv from "dotenv";
import { Groq } from "groq-sdk";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
const apiHash = process.env.TELEGRAM_API_HASH;
const sessionString = process.env.TELEGRAM_SESSION_STRING;

const MONITORED_CHANNELS = [
  "effoyjobs",
  "freelance_ethio",
  "hahujobsforfreshgraduates",
  "jobs_in_ethio",
];

/**
 * Parses raw job text using Groq's Llama-3 model into structured JSON format.
 * Falls back to regex if an error or API rate-limit occurs.
 */
const parseWithAI = async (rawText) => {
  const systemPrompt = `
  You are an expert recruitment parser for Ethiopian job posts. 
  Extract structured details from the raw job text and output ONLY valid JSON using this format:

  {
    "title": "Concise job title or 'Channel Vacancy'",
    "company": "Company name or 'Not Specified'",
    "category": "MUST be exactly one of: ['Software / IT', 'Finance & Accounting', 'Sales & Marketing', 'Healthcare', 'General / Other']",
    "tags": ["array", "of", "up", "to", "5", "keywords"],
    "contactEmail": "extracted email or null",
    "contactPhone": "extracted phone number or null"
  }

  STRICT CATEGORIZATION RULES:
  1. "Software / IT": Include all tech roles, Web/Mobile Developers, DevOps Engineers, ML/AI Specialists, Data Analysts/Engineers, Cloud Engineers, System Admins, CyberSecurity, Product Managers, and IT Support.
  2. "Finance & Accounting": Accountants, Auditors, Financial Analysts, Cashiers, Bankers.
  3. "Sales & Marketing": Digital Marketers, Sales Representatives, Social Media Managers, Content Creators.
  4. "Healthcare": Doctors, Nurses, Pharmacists, Lab Technicians.
  5. "General / Other": Anything else that does not fit the above categories.
  `;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      temperature: 0.1, // Low temperature for deterministic outputs
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawText },
      ],
    });

    const parsedData = JSON.parse(response.choices[0].message.content);
    return parsedData;
  } catch (error) {
    console.warn("⚠️ AI parsing failed, falling back to regex parser:", error.message);
    return parseRawJobText(rawText);
  }
};

// Helper to backfill past 7 days of messages
const backfillPast7Days = async (client) => {
  const sevenDaysAgoSeconds = Math.floor(
    (Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000,
  );
  console.log("⏳ Syncing job posts from the last 7 days using AI...");

  let totalImported = 0;

  for (const channelUsername of MONITORED_CHANNELS) {
    try {
      console.log(`📥 Fetching recent history from @${channelUsername}...`);

      const messages = await client.getMessages(channelUsername, {
        limit: 100,
      });

      for (const msg of messages) {
        if (!msg || !msg.text || msg.date < sevenDaysAgoSeconds) continue;

        const rawText = msg.text;
        const rawHash = generateRawHash(rawText);

        if (!rawHash) continue;

        const existingJob = await Job.findOne({ rawHash });
        if (!existingJob) {
          // Parse using AI with regex fallback
          const parsedData = await parseWithAI(rawText);

          await Job.create({
            rawHash,
            rawText,
            ...parsedData,
            sourceName: `@${channelUsername}`,
            createdAt: new Date(msg.date * 1000),
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
    `✅ Backfill complete! Loaded and AI-parsed ${totalImported} new jobs from the past 7 days.`,
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

        // Parse live stream post using AI
        const parsedData = await parseWithAI(rawText);

        const newJob = await Job.create({
          rawHash,
          rawText,
          ...parsedData,
          sourceName: "Telegram Live Stream",
        });

        console.log(
          `📩 New Live Job Parsed & Saved via AI! Title: "${newJob.title}" | Category: "${newJob.category}"`
        );
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