// utils/telegram.js
import dotenv from "dotenv";

dotenv.config();
import TelegramBot from "node-telegram-bot-api";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn("⚠️ TELEGRAM_BOT_TOKEN is missing in .env");
}

// Initialized with polling false for webhooks / API service calls
export const bot = new TelegramBot(BOT_TOKEN, { polling: false });

/**
 * Sends a stylized job alert direct message to a specific Telegram user
 */
export async function sendJobAlertToUser(telegramId, job) {
  if (!telegramId) {
    console.warn("⚠️ Cannot send Telegram DM: missing telegramId");
    return;
  }

  const message = `
🚨 <b>New Job Posted!</b>

<b>Title:</b> ${escapeHtml(job.title)}
<b>Company:</b> ${escapeHtml(job.company || "Not Specified")}
<b>Category:</b> ${escapeHtml(job.category)}

${job.tags ? `<b>Tags:</b> ${job.tags.map((t) => `#${t.replace(/\s+/g, "")}`).join(" ")}\n` : ""}
${job.contactEmail ? `📧 <b>Email:</b> ${job.contactEmail}\n` : ""}
${job.contactPhone ? `📞 <b>Phone:</b> ${job.contactPhone}\n` : ""}

👇 <b>View Details / Apply:</b>
${job.postUrl || job.companyWebsite || job.link || "https://t.me/EJobExplore_bot"}
  `.trim();

  try {
    await bot.sendMessage(telegramId, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
    console.log(`✅ Alert successfully sent to Telegram ID: ${telegramId}`);
  } catch (err) {
    console.error(`❌ Failed to send Telegram DM to ${telegramId}:`, err.response?.body || err.message);
  }
}

// Utility to prevent HTML injection errors
function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}