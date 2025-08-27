import express from "express";
import { registerAdmin, loginAdmin, changePassword } from "../../controller/admin/authController.js";
import verifyAdmin from "../../middleware/admin/auth.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.put("/change-password/:id", verifyAdmin, changePassword);

export default router;
