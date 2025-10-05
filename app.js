// app.js - ADD ADMIN IMPORTS
import express from "express";
import cors from "cors";
import userAuthRoutes from "./routes/user/authRoutes.js";
import adminAuthRoutes from "./routes/admin/authRoutes.js";
import userLoanRoutes from "./routes/user/userLoanRoutes.js";
import adminLoanRoutes from "./routes/admin/adminLoanRoutes.js";

// USER IMPORTS
import notificationRoutes from "./routes/user/notificationRoutes.js";
import faqRoutes from "./routes/user/faqRoutes.js";
import supportRoutes from "./routes/user/supportRoutes.js";
import contentRoutes from "./routes/user/contentRoutes.js";

// ADMIN IMPORTS
import adminContentRoutes from "./routes/admin/contentManagementRoutes.js";
import adminFaqRoutes from "./routes/admin/faqManagementRoutes.js";
import adminSupportRoutes from "./routes/admin/supportManagementRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running successfully 🚀",
    });
});

// USER ROUTES
app.use("/api/user", userAuthRoutes);
app.use("/api/user/loan", userLoanRoutes);
app.use("/api/user/notifications", notificationRoutes);
app.use("/api/user/faqs", faqRoutes);
app.use("/api/user/support", supportRoutes);
app.use("/api/user/content", contentRoutes);

// ADMIN ROUTES
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin/loan", adminLoanRoutes);
app.use("/api/admin/content", adminContentRoutes);
app.use("/api/admin/faqs", adminFaqRoutes);
app.use("/api/admin/support", adminSupportRoutes);

export default app;