import mongoose from "mongoose";

const User = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true, // Prevents duplicate records for the same user
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    username: {
      type: String,
    },
    photoUrl: {
      type: String,
    },
    authDate: {
      type: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", User);