import Notification from "../../model/user/notificationModel.js";
import { successHelper, errorHelper } from "../../utilities/helpers.js";

// Get all notifications for the logged-in user
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // limit to last 50 notifications

    return successHelper(
      res, 
      notifications, 
      "Notifications fetched successfully"
    );
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch notifications");
  }
};

// Mark specific notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!notification) {
      return errorHelper(res, null, "Notification not found", 404);
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return successHelper(
      res, 
      notification, 
      "Notification marked as read"
    );
  } catch (error) {
    return errorHelper(res, error, "Failed to mark notification as read");
  }
};

// Mark all notifications as read for user
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    return successHelper(
      res, 
      { modifiedCount: result.modifiedCount }, 
      "All notifications marked as read"
    );
  } catch (error) {
    return errorHelper(res, error, "Failed to mark all notifications as read");
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });

    return successHelper(
      res, 
      { unreadCount: count }, 
      "Unread count fetched successfully"
    );
  } catch (error) {
    return errorHelper(res, error, "Failed to get unread count");
  }
};

export {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
};