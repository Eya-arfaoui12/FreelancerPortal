import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ✅ Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized" 
      });
    }

    const { page = 1, limit = 20, type, unreadOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const where = { userId };
    if (type && type !== 'all') {
      where.type = type;
    }
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Count total and unread
    const total = await prisma.notification.count({ where });
    const unreadCount = await prisma.notification.count({ 
      where: { userId, isRead: false } 
    });

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });

  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching notifications"
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    console.log('🔍 markNotificationAsRead called');
    console.log('🔍 Body received:', req.body);

    const userId = req.user?.id;
    const { id } = req.params;
    const { action } = req.body || {};

    if (!userId) {
      console.log('❌ Unauthorized: No user ID');
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Action validation
    const validActions = ['view', 'accept', 'reject'];
    if (action && !validActions.includes(action)) {
      console.log('❌ Invalid action:', action);
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Allowed values: view, accept, reject',
      });
    }

    console.log(`🔍 Looking for notification ${id} for user ${userId}`);
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      console.log('❌ Notification not found');
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    console.log('🔍 Notification found:', notification.id);

    // Mark as read
    const updateData = {
      isRead: true,
      readAt: new Date(),
    };

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: updateData,
    });

    console.log('🔍 Notification marked as read');

    // ⚡️ Proposal Logic - Update status based on action
    if (notification.type === 'PROPOSAL' && notification.metadata) {
      console.log('🔍 Processing PROPOSAL notification with metadata');
      try {
        const metadata = JSON.parse(notification.metadata);
        console.log('🔍 Parsed metadata:', metadata);

        if (metadata && metadata.proposalId) {
          // Verify user is the assigned freelancer
          const proposal = await prisma.proposal.findUnique({
            where: { id: metadata.proposalId },
            include: {
              freelancer: { include: { user: true } },
              project: { include: { createdBy: true } },
            },
          });

          if (!proposal) {
            console.log('❌ Proposal not found');
            return res.status(404).json({
              success: false,
              error: 'Proposal not found',
            });
          }

          if (proposal.freelancer.user.id !== userId) {
            console.log('❌ User not authorized to modify this proposal');
            return res.status(403).json({
              success: false,
              error: 'You are not authorized to modify this proposal',
            });
          }

          let newStatus = 'VIEWED'; // Default
          let projectStatus = null;

          if (action === 'accept') {
            newStatus = 'ACCEPTED';
            projectStatus = 'IN_PROGRESS'; // Project starts
          } else if (action === 'reject') {
            newStatus = 'REJECTED';
            projectStatus = 'CANCELLED'; // Project cancelled
          }

          console.log(`🔍 Updating proposal ${metadata.proposalId} to status: ${newStatus}`);

          // Check project status
          const project = await prisma.project.findUnique({
            where: { id: metadata.projectId },
            include: { createdBy: true },
          });

          if (project && projectStatus && (project.status === 'CANCELLED' || project.status === 'COMPLETED')) {
            console.log(`❌ Project ${project.id} is already ${project.status}`);
            return res.status(400).json({
              success: false,
              error: `Project is already ${project.status.toLowerCase()}`,
            });
          }

          // Freelancer name
          const freelancerName = `${proposal.freelancer.user.firstName} ${proposal.freelancer.user.lastName}`;

          // Notification message with freelancer name
          const notificationMessage = action === 'accept'
            ? `Freelancer ${freelancerName} has accepted your proposal for project "${project.title}". A mission has been created.`
            : `Freelancer ${freelancerName} has rejected your proposal for project "${project.title}". The project has been cancelled.`;

          // Create mission if accepted
          let mission = null;
          if (action === 'accept') {
            const existingMission = await prisma.mission.findFirst({
              where: {
                projectId: proposal.projectId,
                freelancerId: proposal.freelancerId,
              },
            });

            if (!existingMission) {
              mission = await prisma.mission.create({
                data: {
                  title: proposal.project.title,
                  description: proposal.project.description || '',
                  status: 'PENDING',
                  progress: 0,
                  priority: 'MEDIUM',
                  deadline: proposal.project.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  budget: proposal.bidAmount || proposal.project.budget || 0,
                  hoursSpent: 0,
                  totalHours: proposal.estimatedTime || proposal.project.duration || 40,
                  startDate: new Date(),
                  technologies: proposal.project.skills || [],
                  freelancerId: proposal.freelancerId,
                  clientId: proposal.project.createdById,
                  projectId: proposal.projectId,
                },
                include: {
                  project: {
                    select: { title: true, description: true, budget: true, duration: true, deadline: true },
                  },
                  client: {
                    select: { firstName: true, lastName: true },
                  },
                },
              });

              console.log(`✅ Mission created for project ${mission.projectId} and freelancer ${mission.freelancerId}`);
            }
          }

          // Transaction to ensure consistency
          await prisma.$transaction([
            prisma.proposal.update({
              where: { id: metadata.proposalId },
              data: { status: newStatus },
            }),
            ...(projectStatus && metadata.projectId
              ? [
                  prisma.project.update({
                    where: { id: metadata.projectId },
                    data: { status: projectStatus },
                  }),
                ]
              : []),
            ...(project && project.createdBy
              ? [
                  prisma.notification.create({
                    data: {
                      userId: project.createdBy.id,
                      title: 'Proposal Update',
                      message: notificationMessage,
                      type: 'PROPOSAL',
                      metadata: JSON.stringify({
                        projectId: metadata.projectId,
                        projectTitle: project.title,
                        proposalId: metadata.proposalId,
                        missionId: mission ? mission.id : null,
                        action: action,
                        freelancerName: freelancerName,
                      }),
                    },
                  }),
                ]
              : []),
          ]);

          console.log(`✅ Proposal ${metadata.proposalId} updated: ${newStatus}`);
          if (projectStatus) {
            console.log(`✅ Project ${metadata.projectId} updated: ${projectStatus}`);
          }

          // Socket.IO Notification
          if (global.io && project && project.createdBy) {
            global.io.to(project.createdBy.id).emit('newNotification', {
              title: 'Proposal Update',
              message: notificationMessage,
              type: 'PROPOSAL',
              metadata: JSON.stringify({
                projectId: metadata.projectId,
                projectTitle: project.title,
                proposalId: metadata.proposalId,
                missionId: mission ? mission.id : null,
                action: action,
                freelancerName: freelancerName,
              }),
              createdAt: new Date(),
              isRead: false,
            });
            console.log(`✅ Socket.IO notification sent to: ${project.createdBy.id}`);
          }
        } else {
          console.log('❌ No proposalId in metadata');
        }
      } catch (parseError) {
        console.error('❌ Error parsing metadata:', parseError);
        console.error('❌ Raw metadata:', notification.metadata);
      }
    } else {
      console.log('ℹ️ Not a PROPOSAL notification or no metadata');
    }

    res.status(200).json({
      success: true,
      message: `Notification marked as read${action ? ` and proposal ${action === 'accept' ? 'accepted' : 'rejected'}` : ''}`,
      data: updatedNotification,
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    console.error('❌ Error stack:', error.stack);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while marking notification as read',
    });
  }
};

// ✅ Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized" 
      });
    }

    const result = await prisma.notification.updateMany({
      where: { 
        userId,
        isRead: false 
      },
      data: { 
        isRead: true,
        readAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: `${result.count} notifications marked as read`,
      count: result.count
    });

  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      error: "Server error while marking notifications as read"
    });
  }
};

// ✅ Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized" 
      });
    }

    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found"
      });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: "Notification deleted"
    });

  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    res.status(500).json({
      success: false,
      error: "Server error while deleting notification"
    });
  }
};

// ✅ Get unread notifications count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized" 
      });
    }

    const unreadCount = await prisma.notification.count({ 
      where: { 
        userId, 
        isRead: false 
      } 
    });

    res.status(200).json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error("❌ Error counting notifications:", error);
    res.status(500).json({
      success: false,
      error: "Server error while counting notifications"
    });
  }
};