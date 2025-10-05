import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import mongoose from "mongoose";
const PORT = 3000;
const MONGO_URI = "mongodb+srv://test:OGo2M1GfEMRjIvJu@cluster0.p2khqnt.mongodb.net/loan-app?retryWrites=true&w=majority&appName=Cluster0"

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`MongoDB connected live ${MONGO_URI}`);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });