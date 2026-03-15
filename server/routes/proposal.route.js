// proposal.route.js
import express from 'express';
import {
  createProposal,
  getFreelancerProposals,
  updateProposalStatus,
  getProjectProposals
} from '../controllers/proposal.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createProposal);
router.get('/freelancer', getFreelancerProposals);
router.get('/project/:projectId', getProjectProposals);
router.patch('/:id/status', updateProposalStatus);

export default router;