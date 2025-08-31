// routes/user/notificationRoutes.js
import express from "express";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
} from "../../controller/user/notificationController.js";
import { verifyUser } from "../../middleware/user/auth.js";

const router = express.Router();

router.get("/", verifyUser, getMyNotifications);
router.get("/unread-count", verifyUser, getUnreadCount);
router.put("/read/:id", verifyUser, markNotificationAsRead);
router.put("/read-all", verifyUser, markAllNotificationsAsRead);

export default router;