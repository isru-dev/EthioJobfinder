import express from "express";
import crypto from "crypto";
import User from "../models/User.js"; // Import your Mongoose model
const router = express.Router();

function verifyTelegramAuth(data, botToken) {
  const { hash, ...userData } = data;
  if (!hash || !botToken) return false;

  const dataCheckString = Object.keys(userData)
    .sort()
    .filter((key) => userData[key] !== undefined && userData[key] !== null)
    .map((key) => `${key}=${userData[key]}`)
    .join("\n");

  const secretKey = crypto
    .createHash("sha256")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return calculatedHash === hash;
}

router.post("/telegram", async (req, res) => {
  try {
    const telegramData = req.body;
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    // 1. Verify Hash
    const isValid = verifyTelegramAuth(telegramData, BOT_TOKEN);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature. Auth failed!" });
    }

    // 2. Save or Update in MongoDB
    const user = await User.findOneAndUpdate(
      { telegramId: String(telegramData.id) },
      {
        telegramId: String(telegramData.id),
        firstName: telegramData.first_name,
        lastName: telegramData.last_name || "",
        username: telegramData.username || "",
        photoUrl: telegramData.photo_url || "",
        authDate: telegramData.auth_date,
      },
      { new: true, upsert: true } // Creates the user if they don't exist
    );

    // 3. Return saved user data to frontend
    return res.status(200).json({
      message: "Authentication successful",
      user,
    });
  } catch (error) {
    console.error("Auth server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;