import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    firstName: String,
    lastName: String,
    username: String,
    photoUrl: String,
    // Notification preferences
    subscribedCategories: [
      {
        type: String, // e.g. ["Software / IT", "Sales & Marketing"]
      },
    ],
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);