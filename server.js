import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// ROUTES (Adjust path if needed)
import userRoutes from "./routes/user/authRoutes.js";

const app = express();

// ----------- Middlewares -------------
app.use(express.json({ limit: "10mb" }));
app.use(cors());

// ----------- Mongo Connection --------
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
}
connectDB();

// ----------- Routes ------------------
app.get("/", (req, res) => {
  res.send("✅ Server is running successfully.");
});

app.use("/api/user", userRoutes);

// ----------- Server Port -------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});

// ----------- Graceful Shutdown -------
process.on("SIGTERM", () => {
  console.log("🔻 Shutting server down...");
  mongoose.connection.close();
});
