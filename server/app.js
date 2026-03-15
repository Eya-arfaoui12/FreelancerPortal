import './lib/instrument.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma.js';
import * as Sentry from "@sentry/node";
import userRoute from "./routes/user.route.js";
import authRoute from "./routes/auth.route.js";
import freelancerRoute from "./routes/freelancer.route.js";
import contractRoute from "./routes/contracts.route.js"; 
import cookieParser from 'cookie-parser';
import matchRoutes from "./routes/match.route.js";
import projectRoutes from "./routes/project.route.js";
import proposalRoutes from "./routes/proposal.route.js";
import notificationRoutes from "./routes/notification.route.js";
import missionRoutes from "./routes/mission.route.js";
import messageRoutes from './routes/message.route.js';
import dashboardRoutes from "./routes/dashboard.route.js";
import freelancerDashboardRoutes from "./routes/freelancerDashboard.route.js";
import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

// Middleware Socket.IO pour l'authentification
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log("Socket.IO - Aucun token fourni");
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    if (!socket.userId) {
      return next(new Error('Authentication error: Invalid user ID'));
    }
    console.log(`Socket.IO - Utilisateur authentifié: ${socket.userId}`);
    next();
  } catch (error) {
    console.error("Socket.IO - Erreur d'authentification:", error.message);
    next(new Error('Authentication error: Invalid token'));
  }
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log(`Utilisateur connecté: ${socket.id} (ID: ${socket.userId})`);

  // Rejoindre sa propre room
  socket.join(socket.userId);
  console.log(`Utilisateur ${socket.userId} a rejoint sa room`);

  // Gérer la déconnexion
  socket.on('disconnect', () => {
    console.log(`Utilisateur déconnecté: ${socket.id} (ID: ${socket.userId})`);
  });

  // Gérer les erreurs
  socket.on('error', (error) => {
    console.error(`Erreur Socket.IO pour ${socket.userId}:`, error);
  });
});

// Rendre io accessible globalement (pour les contrôleurs)
global.io = io;

// Middleware Express
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static(path.join(process.cwd(), 'Uploads')));

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/freelancers", freelancerRoute);
app.use("/api/contracts", contractRoute);
console.log('✅ Routes des contrats montées sur /api/contracts');
app.use("/api", matchRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/notifications", notificationRoutes);
app.use('/api', missionRoutes);
app.use('/api/messages', messageRoutes);
app.use("/api/dashboard", dashboardRoutes);
console.log('✅ Routes du dashboard montées sur /api/dashboard');
app.use("/api/freelancer-dashboard", freelancerDashboardRoutes);
console.log('✅ Routes du dashboard freelancer montées sur /api/freelancer-dashboard');

// Routes de santé
app.get('/socket-health', (req, res) => {
  res.json({
    connected: io.engine.clientsCount,
    serverTime: new Date().toISOString(),
    socketIo: 'active',
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Serveur fonctionnel !' });
});

app.get('/health', async (req, res) => {
  try {
    await prisma.user.count();
    res.json({
      status: 'OK',
      message: 'Connexion à MongoDB réussie',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erreur de base de données',
      error: error.message,
    });
  }
});

app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

// Middleware 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Middleware d'erreur Sentry
Sentry.setupExpressErrorHandler(app);

// Démarrer le serveur
httpServer.listen(PORT, async () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 URL: http://localhost:${PORT}`);
  try {
    await prisma.$connect();
    console.log('✅ Connexion à MongoDB établie avec succès');
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error.message);
  }
});

// Gestion propre de l'arrêt du serveur
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt du serveur (SIGTERM)...');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

export default app;