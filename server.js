import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import mongoose from "mongoose";
const PORT = 8002;
const MONGO_URI = "mongodb://localhost:27017/loan-app";

mongoose.connect("mongodb://localhost:27017/loan-app")
  .then(() => {
    console.log(`MongoDB connected live ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });