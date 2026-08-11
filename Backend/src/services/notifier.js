import axios from "axios";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Sends a structured job alert message directly to a user's Telegram DM
 */
export const sendTelegramJobAlert = async (telegramId, job) => {
  if (!BOT_TOKEN) return;

  const messageText = `
🚨 **New Job Matching Your Field!**

💼 **${job.title}**
🏢 **Company:** ${job.company}
📁 **Category:** ${job.category}

${job.contactEmail ? `✉️ ${job.contactEmail}` : ""}
${job.contactPhone ? `📞 ${job.contactPhone}` : ""}

🔗 [View Original Post](${job.postUrl || "https://t.me"})
`;

  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: telegramId,
      text: messageText,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    });
  } catch (err) {
    console.error(`Failed to send alert to user ${telegramId}:`, err.response?.data || err.message);
  }
};