import express from 'express';
import { 
  getContracts, 
  createContract, 
  getContractById, 
  updateContract, 
  deleteContract, 
  getContractTemplates, 
  generateContractPDF,
  signContract // Nouvelle fonction importée
} from '../controllers/contracts.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Routes for contracts
router.get('/', getContracts); // GET /api/contracts
router.post('/', createContract); // POST /api/contracts
router.get('/templates', getContractTemplates); // GET /api/contracts/templates (placé avant /:id)
router.get('/:id', getContractById); // GET /api/contracts/:id
router.put('/:id', updateContract); // PUT /api/contracts/:id
router.delete('/:id', deleteContract); // DELETE /api/contracts/:id
router.get('/:id/pdf', generateContractPDF); // GET /api/contracts/:id/pdf
router.patch('/:id/sign', signContract); // PATCH /api/contracts/:id/sign - Nouvelle route pour signature freelancer

export default router;