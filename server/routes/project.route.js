import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  uploadProjectFiles,
  deleteProjectAttachment,
  downloadProjectAttachment ,
  signContract
} from '../controllers/project.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'Uploads/projects/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(ext, '').substring(0, 50);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5
  }
});

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes principales pour les projets
router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

// Routes pour les fichiers attachés
router.post('/:id/attachments', upload.array('files', 5), uploadProjectFiles);
router.get('/:id/attachments/:attachmentId', downloadProjectAttachment); // Nouvelle route
router.delete('/:id/attachments/:attachmentId', deleteProjectAttachment);
router.patch('/:id/attachments/:attachmentId/sign', signContract);

export default router;