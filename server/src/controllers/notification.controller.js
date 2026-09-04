const notificationService = require('../services/notification.service');

const getNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getNotifications({
      userId: req.user._id,
      read: req.query.read,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: notification,
    });
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('unauthorized')) {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);

    res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
