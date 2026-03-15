import express from 'express';
import {
  getFreelancers,
  createFreelancer,
  getFreelancerById,
  updateFreelancer,
  blockFreelancer,
  deleteFreelancer,
  getFreelancerDocuments,
  getFreelancersByCategory
} from '../controllers/freelancer.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Liste des freelancers
router.get('/', getFreelancers);

// Freelancers groupés par catégorie (AVANT /:id)
router.get('/grouped/by-category', getFreelancersByCategory);

// Créer un freelancer
router.post("/", createFreelancer);

// Obtenir un freelancer par ID
router.get('/:id', getFreelancerById);

// Mettre à jour un freelancer (pas besoin de multer, upload Cloudinary côté frontend)
router.put('/:id', updateFreelancer);

// Bloquer/Débloquer un freelancer
router.patch('/:id/block', blockFreelancer);

// Supprimer un freelancer
router.delete('/:id', deleteFreelancer);

// Documents d'un freelancer (protégée par auth)
router.get('/:id/documents', authenticateToken, getFreelancerDocuments);

export default router;