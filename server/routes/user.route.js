// routes/user.route.js
import express from "express";
import { authenticateToken } from '../middleware/auth.js';
import { getAllUsers,
    getUserById,
    getCurrentUser,
    updateUser,
    updateCurrentUser,
    changeUserRole,
    getUserStats,
    searchUsers,
    deleteUser,
    deactivateUser,
    getAllUsersForMessaging } from "../controllers/user.controller.js";

const router = express.Router();

// Appliquer le middleware d'authentification à toutes les routes
router.use(authenticateToken);

// IMPORTANT: Routes spécifiques AVANT les routes paramétrées
router.get('/', getAllUsers);
router.get('/me', getCurrentUser);
router.get('/messaging', getAllUsersForMessaging); // AVANT /:id
router.get('/search', searchUsers); // AVANT /:id
router.put('/me', updateCurrentUser);

// Routes avec paramètres (doivent être APRÈS les routes spécifiques)
router.get('/stats/:id', getUserStats);
router.get('/:id', getUserById); // Cette route doit être APRÈS /messaging et /search
router.put('/:id', updateUser);
router.patch('/:id/role', changeUserRole);
router.delete('/:id', deleteUser);
router.patch('/deactivate/:id', deactivateUser);

export default router;