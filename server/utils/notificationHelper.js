const Notification = require("../models/Notification");
const { emitToUser } = require("../socket/socketManager");

const createNotification = async ({ userId, message, type = "system", link = "" }) => {
  try {
    const notification = await Notification.create({ user: userId, message, type, link });
    // Emit real-time via Socket.io
    emitToUser(userId, "notification", {
      _id: notification._id,
      message,
      type,
      link,
      isRead: false,
      createdAt: notification.createdAt,
    });
    return notification;
  } catch (err) {
    console.error("Notification create error:", err.message);
  }
};

module.exports = { createNotification };
