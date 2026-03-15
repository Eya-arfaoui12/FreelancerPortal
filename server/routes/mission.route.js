import express from 'express';
import { getMissionsByFreelancer, updateMission, getMissionById, uploadMissionAttachment, downloadMissionAttachment } from '../controllers/mission.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/zip'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, PNG, JPG, JPEG, and ZIP files are allowed'));
    }
  },
});

const router = express.Router();

router.use(authenticateToken);

// Routes requiring authentication
router.get('/freelancers/:freelancerId/missions', getMissionsByFreelancer);
router.get('/missions/:id', getMissionById);
router.patch('/missions/:id', updateMission);
router.post('/missions/:id/attachments', upload.single('file'), uploadMissionAttachment);
router.get('/missions/:id/attachments/:attachmentId', downloadMissionAttachment);

export default router;