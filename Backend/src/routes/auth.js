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

    const telegramIdStr = String(telegramData.id);

    // 2. Check if user already exists
    let user = await User.findOne({ telegramId: telegramIdStr });

    if (!user) {
      // Create new user with DEFAULT categories enabled so they receive alerts!
      user = await User.create({
        telegramId: telegramIdStr,
        firstName: telegramData.first_name,
        lastName: telegramData.last_name || "",
        username: telegramData.username || "",
        photoUrl: telegramData.photo_url || "",
        authDate: telegramData.auth_date,
        notificationsEnabled: true,
        // Default to all or primary categories so matching works immediately
        subscribedCategories: [
          "Software / IT",
          "Video / Graphics",
          "Finance & Accounting",
          "Sales & Marketing",
          "Healthcare",
          "General / Other"
        ],
      });
    } else {
      // Update basic details without overriding their existing categories
      user.firstName = telegramData.first_name;
      user.lastName = telegramData.last_name || "";
      user.username = telegramData.username || "";
      user.photoUrl = telegramData.photo_url || "";
      user.authDate = telegramData.auth_date;
      await user.save();
    }

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