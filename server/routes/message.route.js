import express from 'express';
import { getOrCreateConversation, getConversations, sendMessage, getMessagesByConversation, deleteConversation } from '../controllers/message.controlle.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/conversation', authenticateToken, getOrCreateConversation);
router.get('/conversations', authenticateToken, getConversations);
router.delete('/conversation/:id',authenticateToken, deleteConversation); 
router.post('/', authenticateToken, sendMessage);
router.get('/conversation/:id', authenticateToken, getMessagesByConversation);

export default router;