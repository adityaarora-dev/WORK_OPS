const Notification = require('../models/Notification');

/**
 * Creates and persists a notification for a user.
 */
const createNotification = async ({
  recipient,
  type = 'system',
  title,
  message,
  relatedEntity = null,
  relatedEntityId = null,
}) => {
  try {
    if (!recipient) return null;

    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedEntity,
      relatedEntityId,
    });

    return notification;
  } catch (err) {
    console.warn(`[NotificationService Warning] Failed to create notification: ${err.message}`);
    return null;
  }
};

/**
 * Retrieves paginated notifications for an authenticated user.
 */
const getNotifications = async ({ userId, read, page = 1, limit = 20 }) => {
  const query = { recipient: userId };

  if (read !== undefined && read !== null && read !== '') {
    query.read = read === 'true' || read === true;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: userId, read: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Marks a single notification as read, ensuring ownership.
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { read: true, readAt: new Date() } },
    { returnDocument: 'after' }
  );

  if (!notification) {
    throw new Error('Notification not found or unauthorized.');
  }

  return notification;
};

/**
 * Marks all unread notifications for a user as read.
 */
const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );

  return { modifiedCount: result.modifiedCount };
};

/**
 * Returns current unread count for quick Topbar badge display.
 */
const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ recipient: userId, read: false });
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
