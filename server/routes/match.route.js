import express from "express";
import { matchProject } from "../controllers/match.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Toutes les routes de matching nécessitent une authentification
router.use(authenticateToken);

// Route pour le matching de projet
router.post("/match-project/:projectId", matchProject);

export default router;