// app.js - ADD ADMIN IMPORTS
import express from "express";
import cors from "cors";
import morgan from "morgan";
import userAuthRoutes from "./routes/user/authRoutes.js";
import adminAuthRoutes from "./routes/admin/authRoutes.js";
import userLoanRoutes from "./routes/user/userLoanRoutes.js";
import adminLoanRoutes from "./routes/admin/adminLoanRoutes.js";

// USER IMPORTS
import notificationRoutes from "./routes/user/notificationRoutes.js";
import supportRoutes from "./routes/user/supportRoutes.js";
import contentRoutes from "./routes/user/contentRoutes.js";
import loanRequestRoutes from "./routes/user/loanRequestRoute.js";

// ADMIN IMPORTS
import adminContentRoutes from "./routes/admin/contentManagementRoutes.js";
import adminSupportRoutes from "./routes/admin/supportManagementRoutes.js";
import faqRoutes from "./routes/admin/faqRoutes.js";
import settingRoutes from "./routes/admin/settingRoutes.js";
import dashboardRoutes from "./routes/admin/dashboardRoutes.js";
// MIDDLEWARE IMPORTS
import { errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// USER ROUTES
app.use("/api/user", userAuthRoutes);
app.use("/api/user/loan", userLoanRoutes);
app.use("/api/user/notifications", notificationRoutes);
app.use("/api/user/support", supportRoutes);
app.use("/api/user/content", contentRoutes);
app.use("/api/user", loanRequestRoutes);

// ADMIN ROUTES
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", settingRoutes);
app.use("/api/admin/loan", adminLoanRoutes);
app.use("/api/admin/content", adminContentRoutes);
app.use("/api/admin/support", adminSupportRoutes);
app.use("/api/admin", faqRoutes);
app.use("/api/admin", dashboardRoutes);

app.use(errorHandler);

export default app;
