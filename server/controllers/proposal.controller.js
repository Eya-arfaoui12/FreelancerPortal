import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ✅ Create a new proposal with notification
// In proposal.controller.js, createProposal function
export const createProposal = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized" 
      });
    }

    const {
      projectId,
      freelancerId,
      coverLetter,
      bidAmount,
      estimatedTime,
      status
    } = req.body;

    // Required fields validation
    if (!projectId || !freelancerId) {
      return res.status(400).json({
        success: false,
        error: "Project ID and freelancer ID are required"
      });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        budget: true  // ← Get budget
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found"
      });
    }

    // Check if freelancer exists
    const freelancer = await prisma.freelancerProfile.findUnique({
      where: { id: freelancerId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        error: "Freelancer not found"
      });
    }

    // Check if user has permission to create proposals
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'CLIENT')) {
      return res.status(403).json({
        success: false,
        error: "Only administrators and clients can create proposals"
      });
    }

    // Create the proposal first
    const proposal = await prisma.proposal.create({
      data: {
        coverLetter: coverLetter || "",
        bidAmount: bidAmount ? parseFloat(bidAmount) : freelancer.hourlyRate * (estimatedTime || 1),
        estimatedTime: estimatedTime || 1,
        status: status || 'PENDING',
        projectId,
        freelancerId
      },
      include: {
        project: {
          select: {
            title: true,
            budget: true
          }
        },
        freelancer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    // ✅ SOCKET.IO NOTIFICATION - Use project budget
    if (global.io) {
      try {
        const budgetText = project.budget ? `Budget: $${project.budget}` : 'Budget not defined';
        global.io.to(freelancer.user.id).emit('newNotification', {
          id: Date.now().toString(),
          title: "New Project Proposal",
          message: `You have received a new proposal for the project "${project.title}". ${budgetText}`,
          type: 'PROPOSAL',
          metadata: JSON.stringify({
            proposalId: proposal.id,
            projectId: project.id,
            projectTitle: project.title,
            projectBudget: project.budget // ← Project budget
          }),
          createdAt: new Date(),
          isRead: false
        });
        console.log(`✅ Socket.IO notification sent to: ${freelancer.user.id}`);
      } catch (socketError) {
        console.error("❌ Error sending Socket.IO notification:", socketError);
      }
    }

    // ✅ DATABASE NOTIFICATION - Use project budget
    try {
      const budgetText = project.budget ? `Budget: $${project.budget}` : 'Budget not defined';
      await prisma.notification.create({
        data: {
          userId: freelancer.user.id,
          title: "New Project Proposal",
          message: `You have received a new proposal for the project "${project.title}".`,
          type: 'PROPOSAL',
          metadata: JSON.stringify({
            proposalId: proposal.id,
            projectId: project.id,
            projectTitle: project.title,
            projectBudget: project.budget, 
            // bidAmount: proposal.bidAmount, 
            estimatedTime: proposal.estimatedTime,
            status: proposal.status
          })
        }
      });
      console.log(`✅ Notification created for freelancer: ${freelancer.user.firstName} ${freelancer.user.lastName}`);
    } catch (notificationError) {
      console.error("❌ Error creating notification:", notificationError);
    }

    res.status(201).json({
      success: true,
      message: "Proposal created successfully and notification sent",
      data: proposal
    });

  } catch (error) {
    console.error("❌ Error creating proposal:", error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: "A proposal already exists for this project and freelancer"
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error while creating proposal"
    });
  }
};

// ✅ Get freelancer's proposals
export const getFreelancerProposals = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { status } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }

    // Find user's freelancer profile
    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!freelancerProfile) {
      return res.status(404).json({
        success: false,
        error: "Freelancer profile not found"
      });
    }

    const where = { freelancerId: freelancerProfile.id };
    if (status && status !== 'all') {
      where.status = status;
    }

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        project: {
          select: {
            title: true,
            description: true,
            budget: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: proposals
    });

  } catch (error) {
    console.error("❌ Error fetching proposals:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching proposals"
    });
  }
};

// ✅ Update proposal status
export const updateProposalStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Check if proposal exists
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            budget: true,
            duration: true,
            deadline: true,
            skills: true,
            createdById: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        freelancer: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, id: true },
    });

    const isAdmin = user.role === 'ADMIN';
    const isProjectOwner = proposal.project.createdById === userId;
    const isFreelancerOwner = proposal.freelancer.user.id === userId;

    if (!isAdmin && !isProjectOwner && !isFreelancerOwner) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this proposal',
      });
    }

    // Validate status
    const validStatuses = ['PENDING', 'VIEWED', 'ACCEPTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be PENDING, VIEWED, ACCEPTED, or REJECTED',
      });
    }

    // Update status
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: { status },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            budget: true,
            duration: true,
            deadline: true,
            skills: true,
          },
        },
        freelancer: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Create notification for status change
    let notificationTitle = '';
    let notificationMessage = '';
    let notificationUserId = '';

    if (isAdmin || isProjectOwner) {
      notificationUserId = updatedProposal.freelancer.user.id;
      notificationTitle = 'Proposal Status Updated';
      notificationMessage = `Your proposal for project "${updatedProposal.project.title}" has been ${status.toLowerCase()}.`;
    } else if (isFreelancerOwner) {
      notificationUserId = updatedProposal.project.createdById;
      notificationTitle = 'Proposal Updated';
      notificationMessage = `The freelancer ${updatedProposal.freelancer.user.firstName} has ${status === 'WITHDRAWN' ? 'withdrawn' : 'updated'} their proposal for project "${updatedProposal.project.title}".`;
    }

    if (notificationUserId && notificationTitle) {
      await prisma.notification.create({
        data: {
          userId: notificationUserId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'PROPOSAL',
          metadata: JSON.stringify({
            proposalId: updatedProposal.id,
            projectId: updatedProposal.projectId,
            projectTitle: updatedProposal.project.title,
            newStatus: status,
          }),
        },
      });

      if (global.io) {
        try {
          global.io.to(notificationUserId).emit('newNotification', {
            id: Date.now().toString(),
            title: notificationTitle,
            message: notificationMessage,
            type: 'PROPOSAL',
            metadata: JSON.stringify({
              proposalId: updatedProposal.id,
              projectId: updatedProposal.projectId,
              projectTitle: updatedProposal.project.title,
              newStatus: status,
            }),
            createdAt: new Date(),
            isRead: false,
          });
          console.log(`✅ Status notification sent via Socket.IO to: ${notificationUserId}`);
        } catch (socketError) {
          console.error('❌ Error sending status notification via Socket.IO:', socketError);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Proposal status updated successfully',
      data: updatedProposal,
    });
  } catch (error) {
    console.error('❌ Error updating proposal:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating proposal',
    });
  }
};

// ✅ Get project proposals
export const getProjectProposals = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { projectId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }

    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user.role !== 'ADMIN' && project.createdById !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access to this project"
      });
    }

    const proposals = await prisma.proposal.findMany({
      where: { projectId },
      include: {
        freelancer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: proposals
    });

  } catch (error) {
    console.error("❌ Error fetching project proposals:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching proposals"
    });
  }
};