// src/config/db.js
import mongoose from "mongoose";

export const connectDB = async (mongoUri) => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1); // Stop the app if DB connection fails
  }
};
