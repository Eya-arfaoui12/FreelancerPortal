import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /messages/conversation - Créer ou récupérer une conversation
// POST /messages/conversation - Créer ou récupérer une conversation
export const getOrCreateConversation = async (req, res) => {
  try {
    const { targetId, isSupport } = req.body;
    const userId = req.user?.id;

    console.log('=== DEBUG getOrCreateConversation ===');
    console.log('userId:', userId);
    console.log('targetId:', targetId);
    console.log('isSupport:', isSupport);
    console.log('req.body:', req.body);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié',
      });
    }

    if (!targetId && !isSupport) {
      return res.status(400).json({
        success: false,
        error: 'L\'ID du destinataire ou isSupport est requis',
      });
    }

    let conversation;
    if (isSupport) {
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
      });

      if (!admin) {
        return res.status(404).json({
          success: false,
          error: 'Aucun administrateur disponible',
        });
      }

      conversation = await prisma.conversation.findFirst({
        where: {
          userId,
          targetId: admin.id,
          isSupport: true,
        },
        include: {
          target: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
          },
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            userId,
            targetId: admin.id,
            lastMessage: '',
            unread: 0,
            isSupport: true,
          },
          include: {
            target: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
            },
          },
        });
      }
    } else {
      console.log('Recherche de l\'utilisateur cible avec ID:', targetId);
      
      // Vérifier que targetId est valide
      if (!targetId || typeof targetId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'ID utilisateur cible invalide',
        });
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true, isActive: true },
      });

      console.log('Utilisateur cible trouvé:', targetUser);

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur cible non trouvé',
        });
      }

      if (!targetUser.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Utilisateur cible non actif',
        });
      }

      // Chercher une conversation existante
      conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { userId, targetId },
            { userId: targetId, targetId: userId },
          ],
          isSupport: false,
        },
        include: {
          target: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
          },
        },
      });

      console.log('Conversation existante trouvée:', !!conversation);

      if (!conversation) {
        console.log('Création d\'une nouvelle conversation');
        conversation = await prisma.conversation.create({
          data: {
            userId,
            targetId,
            lastMessage: '',
            unread: 0,
            isSupport: false,
          },
          include: {
            target: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
            },
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
            },
          },
        });
        console.log('Nouvelle conversation créée:', conversation.id);
      }
    }

    // Déterminer les informations d'affichage
    let displayInfo;
    if (conversation.isSupport) {
      displayInfo = {
        name: 'Support Team',
        email: 'support@example.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        userId: conversation.targetId
      };
    } else {
      // Déterminer qui est l'autre participant
      const otherUser = conversation.userId === userId ? conversation.target : conversation.user;
      displayInfo = {
        name: `${otherUser.firstName} ${otherUser.lastName}`,
        email: otherUser.email,
        avatar: otherUser.avatar || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        userId: otherUser.id
      };
    }

    const formattedConversation = {
      id: conversation.id,
      name: displayInfo.name,
      email: displayInfo.email,
      avatar: displayInfo.avatar,
      lastMessage: conversation.lastMessage || '',
      unread: conversation.unread || 0,
      timestamp: conversation.updatedAt.toISOString(),
      userId: displayInfo.userId,
      isSupport: conversation.isSupport,
    };

    console.log('Conversation formatée:', formattedConversation);

    res.status(200).json({
      success: true,
      data: formattedConversation,
    });
  } catch (error) {
    console.error('Erreur lors de la gestion de la conversation:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Une conversation avec cet utilisateur existe déjà',
      });
    }
    res.status(500).json({
      success: false,
      error: `Erreur serveur: ${error.message}`,
    });
  }
};

// GET /messages/conversations - Récupérer toutes les conversations
export const getConversations = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié',
      });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userId },
          { targetId: userId },
        ],
      },
      include: {
        target: {
          select: { firstName: true, lastName: true, email: true, avatar: true, role: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const formattedConversations = conversations.map((conv) => {
      const isUserSender = conv.userId === userId;
      const target = isUserSender ? conv.target : conv.user;
      return {
        id: conv.id,
        name: conv.isSupport ? 'Support Team' : `${target.firstName} ${target.lastName}`,
        email: conv.isSupport ? 'support@example.com' : target.email,
        avatar: conv.isSupport
          ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
          : target.avatar || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        lastMessage: conv.lastMessage || '',
        unread: conv.unread,
        timestamp: conv.updatedAt.toISOString(),
        userId: target.id,
        isSupport: conv.isSupport,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedConversations,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({
      success: false,
      error: `Erreur serveur: ${error.message}`,
    });
  }
};

// POST /messages - Envoyer un message (SEULEMENT via API, PAS Socket.IO)
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié',
      });
    }

    if (!conversationId || !content?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'L\'ID de la conversation et le contenu sont requis',
      });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true, targetId: true, isSupport: true },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation non trouvée',
      });
    }

    if (conversation.userId !== senderId && conversation.targetId !== senderId) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé à cette conversation',
      });
    }

    const receiverId = conversation.userId === senderId ? conversation.targetId : conversation.userId;

    // Créer le message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        content: content.trim(),
        isRead: false,
      },
    });

    // Mettre à jour la conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content.trim(),
        updatedAt: new Date(),
        unread: {
          increment: 1,
        },
      },
    });

    const messageData = {
      id: message.id,
      conversationId,
      senderId,
      receiverId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      isRead: message.isRead,
    };

    // Émettre via Socket.IO seulement ici
    console.log('Émission via Socket.IO:', { messageData, senderId, receiverId });
    global.io.to(receiverId).emit('receiveMessage', messageData);

    const updatedConversation = {
      id: conversationId,
      lastMessage: content.trim(),
      timestamp: new Date().toISOString(),
      unread: 1,
      isSupport: conversation.isSupport,
    };
    global.io.to(receiverId).emit('updateConversation', updatedConversation);

    res.status(201).json({
      success: true,
      data: messageData,
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({
      success: false,
      error: `Erreur serveur: ${error.message}`,
    });
  }
};

// GET /messages/conversation/:id - Récupérer les messages d'une conversation
export const getMessagesByConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié',
      });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { userId: true, targetId: true },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation non trouvée',
      });
    }

    if (conversation.userId !== userId && conversation.targetId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé',
      });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      isRead: msg.isRead,
    }));

    // Marquer les messages comme lus
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    // Remettre à zéro le compteur unread pour cet utilisateur
    await prisma.conversation.update({
      where: { id },
      data: { 
        unread: 0,
      },
    });

    res.status(200).json({
      success: true,
      data: formattedMessages,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({
      success: false,
      error: `Erreur serveur: ${error.message}`,
    });
  }
};

// DELETE /messages/conversation/:id - Supprimer une conversation
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié',
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID de conversation requis',
      });
    }

    // Vérifier que la conversation existe et appartient à l'utilisateur
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { userId: true, targetId: true, isSupport: true },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation non trouvée',
      });
    }

    // Vérifier que l'utilisateur a le droit de supprimer cette conversation
    if (conversation.userId !== userId && conversation.targetId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé pour supprimer cette conversation',
      });
    }

    // Supprimer tous les messages de la conversation d'abord
    await prisma.message.deleteMany({
      where: { conversationId: id },
    });

    // Puis supprimer la conversation
    await prisma.conversation.delete({
      where: { id },
    });

    console.log(`Conversation ${id} supprimée par l'utilisateur ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Conversation supprimée avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la conversation:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Conversation non trouvée',
      });
    }

    res.status(500).json({
      success: false,
      error: `Erreur serveur: ${error.message}`,
    });
  }
};