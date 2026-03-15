import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
    try {
        // Vérification admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { page = 1, limit = 10, search, role, isActive } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Construction des filtres
        const where = {};
        
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (role) {
            where.role = role;
        }

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const users = await prisma.user.findMany({
            where,
            skip,
            take: parseInt(limit),
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        projects: true,
                        createdContracts: true,
                        // missions: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.user.count({ where });

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get user by ID
// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;

        // Vérification d'autorisation
        if (req.user.id !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                avatar: true, // Utilisez les champs qui existent réellement
                location: true, // Si ce champ existe
                createdAt: true,
                updatedAt: true,
                freelancerProfile: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        hourlyRate: true,
                        skills: true,
                        experienceLevel: true,
                        availability: true
                    }
                },
                _count: {
                    select: {
                        projects: true,
                        createdContracts: true, // Utilisez le nom correct de la relation
                        clientContracts: true, // Utilisez le nom correct de la relation
                        clientMissions: true, // Utilisez le nom correct de la relation
                        notifications: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get current user profile
export const getCurrentUser = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                avatar: true, // Changé de emailVerified à avatar
                location: true, // Si ce champ existe
                createdAt: true,
                updatedAt: true,
                freelancerProfile: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        hourlyRate: true,
                        skills: true,
                        experienceLevel: true,
                        availability: true,
                        portfolio: true,
                        education: true,
                        certifications: true
                    }
                },
                _count: {
                    select: {
                        projects: true,
                        createdContracts: true,
                        clientContracts: true,
                        clientMissions: true,
                        notifications: {
                            where: { read: false }
                        }
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update user profile
// user.controller.js

// Update user profile
export const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const updateData = req.body;

        // Vérification d'autorisation
        if (req.user.id !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        // Champs autorisés pour la mise à jour
        const allowedFields = ['firstName', 'lastName', 'phone', 'avatar']; // Ajout de 'avatar'
        const filteredData = {};

        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key) && updateData[key] !== undefined) {
                filteredData[key] = updateData[key];
            }
        });

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: filteredData,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                avatar: true, // Inclure avatar dans la réponse
                updatedAt: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });

    } catch (error) {
        console.error('Update user error:', error);
        
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update current user profile
export const updateCurrentUser = async (req, res) => {
    try {
        const updateData = req.body;

        // Champs autorisés pour la mise à jour
        const allowedFields = ['firstName', 'lastName', 'phone', 'avatar']; // Ajout de 'avatar'
        const filteredData = {};

        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key) && updateData[key] !== undefined) {
                filteredData[key] = updateData[key];
            }
        });

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: filteredData,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                avatar: true, // Inclure avatar dans la réponse
                updatedAt: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });

    } catch (error) {
        console.error('Update current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
// Change user role (Admin only)
export const changeUserRole = async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;

        // Vérification admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        // Validation du rôle
        const validRoles = ['CLIENT', 'FREELANCER', 'ADMIN'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isActive: true,
                updatedAt: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            data: updatedUser
        });

    } catch (error) {
        console.error('Change user role error:', error);
        
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get user statistics
export const getUserStats = async (req, res) => {
    try {
        const userId = req.params.id;

        // Vérification d'autorisation
        if (req.user.id !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const stats = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                _count: {
                    select: {
                        projects: true,
                        contracts: {
                            where: { status: 'ACTIVE' }
                        },
                        missions: {
                            where: { status: 'IN_PROGRESS' }
                        },
                        notifications: {
                            where: { read: false }
                        }
                    }
                },
                projects: {
                    select: {
                        status: true
                    }
                },
                contracts: {
                    select: {
                        status: true
                    }
                },
                missions: {
                    select: {
                        status: true
                    }
                }
            }
        });

        if (!stats) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Calcul des statistiques avancées
        const projectStatusCount = stats.projects.reduce((acc, project) => {
            acc[project.status] = (acc[project.status] || 0) + 1;
            return acc;
        }, {});

        const contractStatusCount = stats.contracts.reduce((acc, contract) => {
            acc[contract.status] = (acc[contract.status] || 0) + 1;
            return acc;
        }, {});

        const missionStatusCount = stats.missions.reduce((acc, mission) => {
            acc[mission.status] = (acc[mission.status] || 0) + 1;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            data: {
                totalProjects: stats._count.projects,
                totalContracts: stats._count.contracts,
                totalMissions: stats._count.missions,
                unreadNotifications: stats._count.notifications,
                projectStatusCount,
                contractStatusCount,
                missionStatusCount
            }
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Search users
// Search users
export const searchUsers = async (req, res) => {
    try {
        const { query, role, limit = 10 } = req.query;

        const where = {
            isActive: true
        };

        // Si un query est fourni, ajouter la recherche par nom/email
        if (query && query.trim()) {
            where.OR = [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } }
            ];
        }

        if (role) {
            where.role = role;
        }

        const users = await prisma.user.findMany({
            where,
            take: parseInt(limit),
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                avatar: true,
                freelancerProfile: {
                    select: {
                        title: true,
                        skills: true,
                        experienceLevel: true
                    }
                }
            },
            orderBy: {
                firstName: 'asc'
            }
        });

        res.status(200).json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Vérification que req.user existe
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;

        // Validation: Check if userId is provided
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Check if user exists
        const userToDelete = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                freelancerProfile: true
            }
        });

        if (!userToDelete) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Authorization check
        if (currentUserId !== userId && currentUserRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only delete your own account'
            });
        }

        // Use a transaction to ensure all related data is deleted
        await prisma.$transaction(async (tx) => {
            // 1. Delete all related records (cascade deletion)

            // Delete missions and their related data first
            await tx.missionMilestone.deleteMany({
                where: { mission: { OR: [{ freelancerId: userId }, { clientId: userId }] } }
            });

            await tx.missionAttachment.deleteMany({
                where: { mission: { OR: [{ freelancerId: userId }, { clientId: userId }] } }
            });

            await tx.mission.deleteMany({
                where: { OR: [{ freelancerId: userId }, { clientId: userId }] }
            });

            // Delete contracts and their related data
            await tx.milestone.deleteMany({
                where: { contract: { OR: [{ createdById: userId }, { clientUserId: userId }] } }
            });

            await tx.contractAttachment.deleteMany({
                where: { contract: { OR: [{ createdById: userId }, { clientUserId: userId }] } }
            });

            await tx.contract.deleteMany({
                where: { OR: [{ createdById: userId }, { clientUserId: userId }] }
            });

            // Delete projects and their related data
            await tx.projectAttachment.deleteMany({
                where: { project: { createdById: userId } }
            });

            await tx.milestone.deleteMany({
                where: { project: { createdById: userId } }
            });

            await tx.proposal.deleteMany({
                where: { OR: [{ freelancer: { userId: userId } }, { project: { createdById: userId } }] }
            });

            await tx.project.deleteMany({
                where: { createdById: userId }
            });

            // Delete conversations and messages
            await tx.message.deleteMany({
                where: { OR: [{ senderId: userId }, { receiverId: userId }] }
            });

            await tx.conversation.deleteMany({
                where: { OR: [{ userId: userId }, { targetId: userId }] }
            });

            // Delete notifications
            await tx.notification.deleteMany({
                where: { userId: userId }
            });

            // Delete freelancer profile if exists
            if (userToDelete.freelancerProfile) {
                await tx.freelancerProfile.delete({
                    where: { userId: userId }
                });
            }

            // 2. Finally delete the user
            await tx.user.delete({
                where: { id: userId }
            });
        });

        // If it's the current user's own account, clear the cookie
        if (currentUserId === userId) {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User account and all related data deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);

        // Handle specific Prisma errors
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Soft delete alternative (mark as inactive instead of permanent deletion)
 */
export const deactivateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;

        // Authorization check
        if (currentUserId !== userId && currentUserRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Get user first to get email
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Soft delete: mark user as inactive
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { 
                isActive: false,
                email: `deactivated_${Date.now()}_${user.email}`
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'User account deactivated successfully',
            data: updatedUser
        });

    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get all users for messaging
export const getAllUsersForMessaging = async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    
    const where = {
      id: { not: req.user.id }, // Exclure l'utilisateur actuel
      isActive: true
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      take: parseInt(limit),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        role: true,
        freelancerProfile: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    // Formater la réponse
    const formattedUsers = users.map(user => ({
      ...user,
      title: user.freelancerProfile?.title || 'Utilisateur'
    }));

    res.status(200).json({
      success: true,
      data: formattedUsers
    });

  } catch (error) {
    console.error('Get users for messaging error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};