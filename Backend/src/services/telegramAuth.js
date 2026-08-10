import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";//to accept otp in the terminal
import dotenv from 'dotenv';

dotenv.config();

const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
const apiHash = process.env.TELEGRAM_API_HASH;

if (!apiId || !apiHash) {
  console.error("❌ ERROR: TELEGRAM_API_ID and TELEGRAM_API_HASH are missing in your .env file!");
  process.exit(1);
}

// Start with an empty string session for new authentication
const stringSession = new StringSession("");

(async () => {
  console.log("⚡ Initiating GramJS Telegram Authentication...");

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  // GramJS interactive login prompt
  await client.start({
    phoneNumber: async () => await input.text("📱 Enter your phone number (+251...): "),
    password: async () => await input.text("🔐 Enter your 2FA password (leave empty if none): "),
    phoneCode: async () => await input.text("💬 Enter the OTP code Telegram sent you: "),
    onError: (err) => console.error("❌ Auth Error:", err),
  });

  console.log("\n✅ Authenticated successfully!\n");
  console.log("==================== COPY YOUR SESSION STRING ====================");
  console.log(client.session.save());
  console.log("==================================================================\n");
  console.log("👉 Paste the string above into your .env as TELEGRAM_SESSION_STRING\n");

  await client.disconnect();
  process.exit(0);
})();