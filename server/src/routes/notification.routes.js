const express = require('express');
const { authenticateUser } = require('../middlewares/auth');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

router.use(authenticateUser);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
