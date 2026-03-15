import express from 'express';
import { 
  getFreelancerStats,
  getRevenueData,
  getMissionStatusDistribution,
  getWeeklyPerformance,
  getRecentProjects
} from '../controllers/freelancerDashboard.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour le dashboard freelancer
router.get('/stats', getFreelancerStats);
router.get('/revenue', getRevenueData);
router.get('/mission-status', getMissionStatusDistribution);
router.get('/weekly-performance', getWeeklyPerformance);
router.get('/recent-projects', getRecentProjects);

export default router;