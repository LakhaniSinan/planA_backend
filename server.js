import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import mongoose from "mongoose";
const PORT = 8002;
const MONGO_URI = "mongodb://localhost:27017/loan-app";

mongoose.connect("mongodb+srv://test:OGo2M1GfEMRjIvJu@cluster0.p2khqnt.mongodb.net/loan-app?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    console.log(`MongoDB connected live ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });