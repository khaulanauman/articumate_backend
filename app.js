// app.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables from .env
dotenv.config();

const app = express();

// --- CORS CONFIG ---
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman)
    if (!origin) return callback(null, true);

    // Allow all localhost and 127.0.0.1 ports during development
    if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
      return callback(null, true);
    }

    console.warn(`❌ CORS blocked request from: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// --- ROUTES ---
// Unified authentication routes (Signup + Login)
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes); 
// Example endpoints:
// POST http://localhost:8080/api/auth/signup
// POST http://localhost:8080/api/auth/login

// --- DATABASE CONNECTION ---
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://khaulanauman_db_user:zi0Ta98LQhRmI5kd@articumatedb.e7ezvcg.mongodb.net/articumateDB?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// --- TEST ROUTE ---
app.get("/", (req, res) => {
  res.send("ArticuMate backend connected to MongoDB ✅");
});
