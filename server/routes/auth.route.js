import express from "express";
import { register, login, logout, getCurrentUser } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticateToken, getCurrentUser);

export default router;