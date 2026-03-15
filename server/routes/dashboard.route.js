import express from 'express';
import { 
  getGlobalMetrics, 
  getMonthlyProjectsStats,
  getMonthlyTarget
} from '../controllers/dashboard.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour le dashboard
router.get('/metrics', getGlobalMetrics);
router.get('/monthly-projects', getMonthlyProjectsStats);
router.get('/monthly-target', getMonthlyTarget);

export default router;