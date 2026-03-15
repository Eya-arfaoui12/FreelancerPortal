import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const uploadDir = path.join(process.cwd(), 'Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper function to normalize status to uppercase
const normalizeStatus = (status) => {
  if (!status) return null;
  return status.toUpperCase();
};

// GET /freelancers/:freelancerId/missions - Fetch all missions for a freelancer
export const getMissionsByFreelancer = async (req, res) => {
  try {
    const { freelancerId } = req.params;
    const userId = req.user?.id;

    console.log(`Fetching missions for freelancerId: ${freelancerId}, userId: ${userId}`);

    // Verify the authenticated user is the freelancer
    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { userId: freelancerId },
      select: { id: true, userId: true },
    });

    if (!freelancerProfile) {
      console.log(`Freelancer profile not found for freelancerId: ${freelancerId}`);
      return res.status(404).json({
        success: false,
        error: 'Freelancer not found',
      });
    }

    if (userId !== freelancerId) {
      console.log(`Access denied for userId: ${userId} on freelancerId: ${freelancerId}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own missions.',
      });
    }

    // Fetch missions for the freelancer
    const missions = await prisma.mission.findMany({
      where: {
        freelancerId: freelancerProfile.id,
      },
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
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        contract: {
          select: {
            id: true,
            title: true,
            rate: true,
          },
        },
        attachments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format missions to match frontend expectations
    const formattedMissions = missions.map(mission => ({
      id: mission.id,
      project: mission.project?.title || mission.title,
      projectId: mission.projectId, // Ajout du projectId
      client: `${mission.client.firstName} ${mission.client.lastName}`,
      status: mission.status.toLowerCase(),
      progress: mission.progress || 0,
      deadline: mission.deadline ? mission.deadline.toISOString().split('T')[0] : null,
      budget: mission.budget || mission.project?.budget || 0,
      hoursSpent: mission.hoursSpent || 0,
      totalHours: mission.totalHours || mission.project?.duration || 0,
      priority: mission.priority.toLowerCase(),
      description: mission.description || mission.project?.description || '',
      startDate: mission.startDate ? mission.startDate.toISOString().split('T')[0] : null,
      technologies: mission.technologies || mission.project?.skills || [],
      clientInfo: {
        id: mission.client.id,
        name: `${mission.client.firstName} ${mission.client.lastName}`,
        email: mission.client.email || '',
        phone: mission.client.phone || '',
      },
      attachments: mission.attachments.map(attachment => ({
        id: attachment.id,
        name: attachment.name,
        size: attachment.size,
        date: attachment.createdAt,
      })),
    }));

    // Calculate statistics
    const stats = {
      total: missions.length,
      completed: missions.filter(m => m.status === 'COMPLETED').length,
      inProgress: missions.filter(m => m.status === 'IN_PROGRESS').length,
      pending: missions.filter(m => m.status === 'PENDING').length,
      totalRevenue: missions
        .filter(m => m.status === 'COMPLETED')
        .reduce((sum, m) => sum + (m.budget || m.project?.budget || 0), 0),
    };

    console.log(`Fetched ${missions.length} missions for freelancerId: ${freelancerId}`);
    res.status(200).json({
      success: true,
      data: formattedMissions,
      stats,
    });
  } catch (error) {
    console.error('Error fetching missions:', error);
    res.status(500).json({
      success: false,
      error: error.message.includes('Route non trouvée') ? 'Route not found' : `Server error: ${error.message}`,
    });
  }
};

// GET /missions/:id - Fetch details of a specific mission
export const getMissionById = async (req, res) => {
  try {
    console.log('req.params:', req.params);
    const missionId = req.params.id;
    const userId = req.user?.id;

    if (!missionId) {
      console.log('Mission ID is missing in request parameters');
      return res.status(400).json({
        success: false,
        error: 'Mission ID is required',
      });
    }

    console.log(`Fetching mission ID: ${missionId} for user: ${userId}`);

    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
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
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        contract: {
          select: {
            id: true,
            title: true,
            rate: true,
          },
        },
        attachments: true,
      },
    });

    if (!mission) {
      console.log(`Mission ${missionId} not found`);
      return res.status(404).json({
        success: false,
        error: 'Mission not found',
      });
    }

    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { id: mission.freelancerId },
      select: { userId: true },
    });

    if (!freelancerProfile) {
      console.log(`Freelancer profile not found for mission ${missionId}`);
      return res.status(404).json({
        success: false,
        error: 'Freelancer profile not found',
      });
    }

    if (freelancerProfile.userId !== userId) {
      console.log(`Access denied for user ${userId} on mission ${missionId}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own missions.',
      });
    }

    const formattedMission = {
      id: mission.id,
      project: mission.project?.title || mission.title,
      projectId: mission.projectId, // Ajout du projectId
      client: `${mission.client.firstName} ${mission.client.lastName}`,
      status: mission.status.toLowerCase(),
      progress: mission.progress || 0,
      deadline: mission.deadline ? mission.deadline.toISOString().split('T')[0] : null,
      budget: mission.budget || mission.project?.budget || 0,
      hoursSpent: mission.hoursSpent || 0,
      totalHours: mission.totalHours || mission.project?.duration || 0,
      priority: mission.priority.toLowerCase(),
      description: mission.description || mission.project?.description || '',
      startDate: mission.startDate ? mission.startDate.toISOString().split('T')[0] : null,
      technologies: mission.technologies || mission.project?.skills || [],
      clientInfo: {
        id: mission.client.id,
        name: `${mission.client.firstName} ${mission.client.lastName}`,
        email: mission.client.email || '',
        phone: mission.client.phone || '',
      },
      attachments: mission.attachments.map(attachment => ({
        id: attachment.id,
        name: attachment.name,
        size: attachment.size,
        date: attachment.createdAt,
      })),
    };

    console.log(`Mission ${missionId} fetched successfully`);
    res.status(200).json({
      success: true,
      data: formattedMission,
    });
  } catch (error) {
    console.error(`Error fetching mission:`, error);
    res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`,
    });
  }
};

// PATCH /missions/:id - Update mission details
export const updateMission = async (req, res) => {
  try {
    const missionId = req.params.id;
    const { status, progress, hoursSpent, totalHours, priority } = req.body;
    const userId = req.user?.id;

    console.log(`Updating mission ID: ${missionId} for user: ${userId}`);

    // Verify mission exists
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        freelancer: {
          select: { userId: true, id: true },
        },
        project: {
          select: { id: true, title: true, description: true, budget: true, duration: true, deadline: true, status: true },
        },
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!mission) {
      console.log(`Mission ${missionId} not found`);
      return res.status(404).json({
        success: false,
        error: 'Mission not found',
      });
    }

    // Verify the authenticated user is the freelancer
    if (mission.freelancer.userId !== userId) {
      console.log(`Access denied for user ${userId} on mission ${missionId}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only update your own missions.',
      });
    }

    // Validate inputs
    const updateData = {};
    const errors = [];

    if (status !== undefined) {
      const normalizedStatus = normalizeStatus(status);
      const validStatuses = ['DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
      if (!validStatuses.includes(normalizedStatus)) {
        errors.push('Invalid status. Must be DRAFT, PENDING, IN_PROGRESS, COMPLETED, ON_HOLD, or CANCELLED');
      } else {
        updateData.status = normalizedStatus;
      }
    }

    if (progress !== undefined) {
      const progressNum = parseInt(progress);
      if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
        errors.push('Progress must be a number between 0 and 100');
      } else {
        updateData.progress = progressNum;
      }
    }

    if (hoursSpent !== undefined) {
      const hoursSpentNum = parseFloat(hoursSpent);
      if (isNaN(hoursSpentNum) || hoursSpentNum < 0) {
        errors.push('Hours spent must be a non-negative number');
      } else {
        updateData.hoursSpent = hoursSpentNum;
      }
    }

    if (totalHours !== undefined) {
      const totalHoursNum = parseFloat(totalHours);
      if (isNaN(totalHoursNum) || totalHoursNum <= 0) {
        errors.push('Total hours must be a positive number');
      } else {
        updateData.totalHours = totalHoursNum;
      }
    }

    if (priority !== undefined) {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
      if (!validPriorities.includes(priority.toUpperCase())) {
        errors.push('Invalid priority. Must be LOW, MEDIUM, or HIGH');
      } else {
        updateData.priority = priority.toUpperCase();
      }
    }

    if (errors.length > 0) {
      console.log(`Validation errors for mission ${missionId}: ${errors.join('; ')}`);
      return res.status(400).json({
        success: false,
        error: errors.join('; '),
      });
    }

    if (Object.keys(updateData).length === 0) {
      console.log(`No valid data provided for updating mission ${missionId}`);
      return res.status(400).json({
        success: false,
        error: 'No valid data provided for update',
      });
    }

    // Auto-update status based on progress
    if (progress !== undefined) {
      const progressNum = parseInt(progress);
      if (progressNum >= 100) {
        updateData.status = 'COMPLETED';
      } else if (progressNum >= 50) {
        updateData.status = 'IN_PROGRESS';
      } else {
        updateData.status = 'PENDING';
      }
      console.log(`Auto-updating status to: ${updateData.status} based on progress: ${progressNum}`);
    }

    // Update mission
    const updatedMission = await prisma.mission.update({
      where: { id: missionId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        project: {
          select: { id: true, title: true, description: true, budget: true, duration: true, deadline: true, status: true },
        },
        client: {
          select: { firstName: true, lastName: true },
        },
        freelancer: {
          select: { id: true },
        },
      },
    });

    // Update project status and projectsCompleted if necessary
    if (updateData.status && mission.project?.id) {
      const projectId = mission.project.id;
      // Fetch all missions for this project
      const projectMissions = await prisma.mission.findMany({
        where: { projectId: projectId },
        select: { status: true, freelancerId: true },
      });

      // Determine project status based on mission statuses
      let projectStatus = 'IN_PROGRESS'; // Default to IN_PROGRESS
      const allMissionsCompleted = projectMissions.every(m => m.status === 'COMPLETED');
      const anyMissionInProgress = projectMissions.some(m => m.status === 'IN_PROGRESS');
      const allMissionsCancelled = projectMissions.every(m => m.status === 'CANCELLED');

      if (allMissionsCompleted && mission.project.status !== 'COMPLETED') {
        projectStatus = 'COMPLETED';
        // Increment projectsCompleted for each freelancer involved, only if project wasn't already completed
        const freelancerIds = [...new Set(projectMissions.map(m => m.freelancerId))];
        for (const freelancerId of freelancerIds) {
          await prisma.freelancerProfile.update({
            where: { id: freelancerId },
            data: {
              projectsCompleted: { increment: 1 },
            },
          });
        }
      } else if (allMissionsCancelled) {
        projectStatus = 'CANCELLED';
      } else if (!anyMissionInProgress && projectMissions.some(m => m.status === 'PENDING')) {
        projectStatus = 'PUBLISHED';
      }

      // Update project status
      await prisma.project.update({
        where: { id: projectId },
        data: { status: projectStatus },
      });

      console.log(`Project ${projectId} status updated to: ${projectStatus}`);
    }

    // Fetch updated freelancer profile to include in response
    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { id: mission.freelancer.id },
      select: { projectsCompleted: true },
    });

    console.log(`Mission ${missionId} updated successfully`);
    res.status(200).json({
      success: true,
      message: 'Mission updated successfully',
      data: {
        id: updatedMission.id,
        project: updatedMission.project?.title || updatedMission.title,
        client: `${updatedMission.client.firstName} ${updatedMission.client.lastName}`,
        status: updatedMission.status.toLowerCase(),
        progress: updatedMission.progress,
        deadline: updatedMission.deadline ? updatedMission.deadline.toISOString().split('T')[0] : null,
        budget: updatedMission.budget || updatedMission.project?.budget || 0,
        hoursSpent: updatedMission.hoursSpent,
        totalHours: updatedMission.totalHours || updatedMission.project?.duration || 0,
        priority: updatedMission.priority.toLowerCase(),
        description: updatedMission.description || updatedMission.project?.description || '',
        projectsCompleted: freelancerProfile.projectsCompleted || 0,
      },
    });
  } catch (error) {
    console.error(`Error updating mission:`, error);
    res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`,
    });
  }
};

// POST /missions/:id/attachments - Upload a file for a mission
export const uploadMissionAttachment = async (req, res) => {
  try {
    const missionId = req.params.id;
    const userId = req.user?.id;
    const file = req.file;

    console.log(`Uploading file for mission ID: ${missionId} by user: ${userId}`);

    if (!file) {
      console.log('No file uploaded');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Validate file size and type
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/zip'];
    if (file.size > maxSize) {
      console.log(`File size exceeds limit: ${file.size} bytes`);
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 10MB limit',
      });
    }
    if (!allowedTypes.includes(file.mimetype)) {
      console.log(`Invalid file type: ${file.mimetype}`);
      return res.status(400).json({
        success: false,
        error: 'Only PDF, PNG, JPG, JPEG, and ZIP files are allowed',
      });
    }

    // Verify mission exists and user is the assigned freelancer
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        freelancer: { select: { userId: true } },
        project: { select: { id: true } },
      },
    });

    if (!mission) {
      console.log(`Mission ${missionId} not found`);
      return res.status(404).json({
        success: false,
        error: 'Mission not found',
      });
    }

    if (mission.freelancer.userId !== userId) {
      console.log(`Access denied for user ${userId} on mission ${missionId}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only upload files to your own missions.',
      });
    }

    // Format file size
    const formatFileSize = (bytes) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    // Create MissionAttachment
    const missionAttachment = await prisma.missionAttachment.create({
      data: {
        name: file.originalname,
        size: formatFileSize(file.size),
        type: file.mimetype,
        url: `/Uploads/${file.filename}`,
        missionId: missionId,
        createdAt: new Date(),
      },
    });

    // Create ProjectAttachment if mission has a project
    if (mission.project?.id) {
      await prisma.projectAttachment.create({
        data: {
          name: file.originalname,
          size: formatFileSize(file.size),
          type: file.mimetype,
          url: `/Uploads/${file.filename}`,
          projectId: mission.project.id,
          createdAt: new Date(),
        },
      });
      console.log(`ProjectAttachment created for project ID: ${mission.project.id}`);
    }

    console.log(`File uploaded successfully for mission ${missionId}`);
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: missionAttachment.id,
        name: missionAttachment.name,
        size: missionAttachment.size,
        date: missionAttachment.createdAt,
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`,
    });
  }
};

// GET /missions/:id/attachments/:attachmentId - Download a mission attachment
export const downloadMissionAttachment = async (req, res) => {
  try {
    const { id: missionId, attachmentId } = req.params;
    const userId = req.user?.id;

    // Validate parameters
    if (!missionId || !attachmentId) {
      console.log(`Missing parameters: missionId=${missionId}, attachmentId=${attachmentId}`);
      return res.status(400).json({
        success: false,
        error: 'Mission ID and Attachment ID are required',
      });
    }

    console.log(`Downloading attachment ${attachmentId} for mission ${missionId} by user: ${userId}`);

    // Verify mission exists and user is the assigned freelancer
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        freelancer: { select: { userId: true } },
      },
    });

    if (!mission) {
      console.log(`Mission ${missionId} not found`);
      return res.status(404).json({
        success: false,
        error: 'Mission not found',
      });
    }

    if (mission.freelancer.userId !== userId) {
      console.log(`Access denied for user ${userId} on mission ${missionId}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only download files from your own missions.',
      });
    }

    // Fetch attachment
    const attachment = await prisma.missionAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      console.log(`Attachment ${attachmentId} not found`);
      return res.status(404).json({
        success: false,
        error: 'Attachment not found',
      });
    }

    if (attachment.missionId !== missionId) {
      console.log(`Attachment ${attachmentId} does not belong to mission ${missionId}`);
      return res.status(403).json({
        success: false,
        error: 'Attachment does not belong to this mission',
      });
    }

    // Resolve file path
    const filePath = path.join(process.cwd(), 'Uploads', path.basename(attachment.url));
    if (!fs.existsSync(filePath)) {
      console.log(`File not found at path: ${filePath}`);
      return res.status(404).json({
        success: false,
        error: 'File not found on server',
      });
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.name}"`);
    res.setHeader('Content-Type', attachment.type);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    console.log(`Attachment ${attachmentId} downloaded successfully`);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`,
    });
  }
};