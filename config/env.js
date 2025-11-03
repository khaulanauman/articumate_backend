// src/config/env.js
import dotenv from "dotenv";
dotenv.config();

export default {
  port: process.env.PORT || 8080,
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/articumate",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
};
