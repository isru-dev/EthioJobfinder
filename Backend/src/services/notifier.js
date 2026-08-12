import axios from "axios";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Helper to escape simple HTML characters in dynamic job data
const escapeHtml = (text = "") =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Sends a structured job alert message directly to a user's Telegram DM
 */
export const sendTelegramJobAlert = async (telegramId, job) => {
  if (!BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN is missing in environment variables.");
    return;
  }

  const title = escapeHtml(job.title);
  const company = escapeHtml(job.company || "Not specified");
  const category = escapeHtml(job.category || "General");
  const postUrl = job.postUrl || "https://t.me";

  const messageText = `🚨 <b>New Job Matching Your Field!</b>

💼 <b>${title}</b>
🏢 <b>Company:</b> ${company}
📁 <b>Category:</b> ${category}
${job.contactEmail ? `\n✉️ ${escapeHtml(job.contactEmail)}` : ""}
${job.contactPhone ? `\n📞 ${escapeHtml(job.contactPhone)}` : ""}

🔗 <a href="${postUrl}">View Original Post</a>`;

  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: telegramId,
      text: messageText,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    });
  } catch (err) {
    console.error(
      `Failed to send alert to user ${telegramId}:`,
      err.response?.data || err.message
    );
  }
};