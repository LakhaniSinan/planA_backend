import express from "express";
import getDashboardData from "../../controller/admin/dashboardController.js";

const router = express.Router();

router.get("/dashboard", getDashboardData);

export default router;
