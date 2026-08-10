import crypto from "crypto";

export const generateRawHash = (text) => {
  if (!text) return null;
  // Clean up whitespace before hashing
  const cleanText = text.trim().toLowerCase().replace(/\s+/g, " ");
  return crypto.createHash("md5").update(cleanText).digest("hex");
};