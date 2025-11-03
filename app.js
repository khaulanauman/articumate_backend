const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// --- Connect to MongoDB ---
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/articumate";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");

    // Start server only after DB connects
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// Health check route
app.get("/", (req, res) => {
  res.send("ArticuMate backend connected to MongoDB ✅");
});
