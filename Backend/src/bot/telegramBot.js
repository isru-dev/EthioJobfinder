// utils/telegram.js
import TelegramBot from "node-telegram-bot-api";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // Get this from @BotFather on Telegram

if (!BOT_TOKEN) {
  console.warn("TELEGRAM_BOT_TOKEN is missing in .env");
}

export const bot = new TelegramBot(BOT_TOKEN, { polling: false });

/**
 * Sends a stylized job alert direct message to a specific Telegram user
 */
export async function sendJobAlertToUser(telegramId, job) {
  const message = `
🚨 *New Job Posted!*

*Title:* ${job.title}
*Company:* ${job.company || "Not Specified"}
*Category:* ${job.category}

${job.description ? `_${job.description.slice(0, 150)}..._` : ""}

👇 *View Full Job:*
${job.link || "Check the website for details"}
  `;

  try {
    await bot.sendMessage(telegramId, message, {
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    });
    console.log(`Alert sent to Telegram ID: ${telegramId}`);
  } catch (err) {
    console.error(`Failed to send Telegram DM to ${telegramId}:`, err.message);
  }
}