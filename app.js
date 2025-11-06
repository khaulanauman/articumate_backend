// app.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const loginRoutes = require("./routes/loginRoutes");
const guardianFeedRoutes = require("./routes/community/guardianFeedRoutes");
const guardianGroupsRoutes = require("./routes/community/guardianGroupsRoutes");
const guardianAccessRoutes = require("./routes/guardianAccessRoutes");


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
    
    console.warn(`CORS blocked request from: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// --- ROUTES ---
app.use("/api/auth", loginRoutes);
app.use("/api/auth", authRoutes); 
app.use("/api/guardian", guardianFeedRoutes);
app.use("/api/guardian", guardianGroupsRoutes);
app.use("/api/guardian/access", guardianAccessRoutes);

// --- DATABASE CONNECTION ---
const MONGO_URI =
  process.env.MONGO_URI

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB!!");

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB connection error :( :", err.message);
    process.exit(1);
  });

// --- TEST ROUTE ---
app.get("/", (req, res) => {
  res.send("ArticuMate backend connected to MongoDB!!");
});
