// middleware/auth.js
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticateToken = async (req, res, next) => {
  try {
    // Vérifier d'abord le cookie HTTP-only
    let token = req.cookies.token;
    
    // Si pas de cookie, vérifier le header Authorization (pour compatibilité)
    if (!token && req.headers.authorization) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    console.log('Token décodé:', decoded); // ← Ajouter pour le debug

    // Vérifier que l'ID est présent
    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: missing user ID'
      });
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }, // ← CORRIGÉ ICI : decoded.id au lieu de decoded.userId
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};