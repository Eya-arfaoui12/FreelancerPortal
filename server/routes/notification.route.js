import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount
} from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les notifications
router.get('/', getUserNotifications); // GET /api/notifications
router.get('/unread-count', getUnreadCount); // GET /api/notifications/unread-count
router.patch('/:id/read', markNotificationAsRead);// PATCH /api/notifications/:id/read
router.patch('/mark-all-read', markAllNotificationsAsRead); // PATCH /api/notifications/mark-all-read
router.delete('/:id', deleteNotification); // DELETE /api/notifications/:id

export default router;