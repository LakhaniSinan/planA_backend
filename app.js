import express from "express";
import cors from "cors";
import userAuthRoutes from "./routes/user/authRoutes.js";
import adminAuthRoutes from "./routes/admin/authRoutes.js";
import userLoanRoutes from "./routes/user/userLoanRoutes.js";
import adminLoanRoutes from "./routes/admin/adminLoanRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/user", userAuthRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin/loan", adminLoanRoutes);  
app.use("/api/user/loan", userLoanRoutes);   

export default app;
