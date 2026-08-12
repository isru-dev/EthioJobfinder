import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Update target categories for notifications
router.post("/preferences", async (req, res) => {
  try {
    const { telegramId, categories, notificationsEnabled } = req.body;

    // 1. Guard check for missing telegramId
    if (!telegramId) {
      return res.status(400).json({ error: "telegramId is required" });
    }

    // 2. Perform the update / upsert safely
    const updatedUser = await User.findOneAndUpdate(
      { telegramId: String(telegramId) },
      {
        $set: {
          subscribedCategories: Array.isArray(categories) ? categories : [],
          notificationsEnabled: Boolean(notificationsEnabled),
        },
      },
      { 
        new: true,         // Return updated doc
        upsert: true,      // Create if missing
        runValidators: true // Enforce Mongoose schema rules
      }
    );

    res.json({
      message: "Preferences saved successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating preferences:", err);
    res.status(500).json({ error: "Failed to update user preferences" });
  }
});

export default router;