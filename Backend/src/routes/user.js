import express from "express";
import { User } from "../models/User.js";

const router = express.Router();

// Update target categories for notifications
router.post("/preferences", async (req, res) => {
  try {
    const { telegramId, categories, notificationsEnabled } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { telegramId: telegramId.toString() },
      {
        subscribedCategories: categories,
        notificationsEnabled,
      },
      { new: true, upsert: true }
    );

    res.json({ message: "Preferences saved successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user preferences" });
  }
});

export default router;