import express from "express";
import crypto from "crypto";
const router = express.Router();

/**
 * Verifies the Telegram auth payload signature using HMAC-SHA-256
 */
function verifyTelegramAuth(data, botToken) {
  const { hash, ...userData } = data;

  if (!hash || !botToken) return false;

  // 1. Sort the data keys alphabetically
  const dataCheckString = Object.keys(userData)
    .sort()
    .filter((key) => userData[key] !== undefined && userData[key] !== null)
    .map((key) => `${key}=${userData[key]}`)
    .join("\n");

  // 2. Hash the Bot Token using SHA256 to create the secret key
  const secretKey = crypto
    .createHash("sha256")
    .update(botToken)
    .digest();

  // 3. Generate HMAC-SHA256 signature from the data check string
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // 4. Compare calculated hash with the provided hash
  return calculatedHash === hash;
}

// Route: POST /api/auth/telegram
router.post("/telegram", async (req, res) => {
  try {
    const telegramData = req.body;
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    // Verify authenticity
    const isValid = verifyTelegramAuth(telegramData, BOT_TOKEN);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature. Auth failed!" });
    }

    // Optional: Check if the auth token is older than 24 hours to prevent replay attacks
    const authDate = parseInt(telegramData.auth_date, 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return res.status(400).json({ error: "Data is outdated." });
    }

    /* 
      At this point, telegramData is 100% verified!
      Example MongoDB logic (using Mongoose):
      
      let user = await User.findOne({ telegramId: telegramData.id });
      if (!user) {
        user = await User.create({
          telegramId: telegramData.id,
          firstName: telegramData.first_name,
          lastName: telegramData.last_name,
          username: telegramData.username,
          photoUrl: telegramData.photo_url,
        });
      }
    */

    return res.status(200).json({
      message: "Authentication successful",
      user: {
        id: telegramData.id,
        first_name: telegramData.first_name,
        username: telegramData.username,
      },
    });
  } catch (error) {
    console.error("Auth server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;