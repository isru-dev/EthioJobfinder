import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Update target categories for notifications
// Express Route: POST /api/user/preferences
router.post("/preferences", async (req, res) => {
  try {
    const { telegramId, categories, notificationsEnabled } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: "telegramId is required" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { telegramId: String(telegramId) },
      {
        $set: {
          subscribedCategories: categories, // Maps frontend 'categories' to schema 'subscribedCategories'
          notificationsEnabled: notificationsEnabled,
        },
      },
      { new: true, upsert: true }
    );

    res.json({ message: "Preferences saved successfully", user: updatedUser });
  } catch (err) {
    console.error("Preferences Update Error:", err);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

export default router;