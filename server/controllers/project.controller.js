import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { PDFDocument, rgb } from 'pdf-lib';

const prisma = new PrismaClient();
const uploadDir = path.join(process.cwd(), 'Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// ✅ Créer un nouveau projet (Admin seulement)
export const createProject = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Non autorisé" 
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: "Accès refusé. Seuls les administrateurs peuvent créer des projets." 
      });
    }

    const {
      title,
      description,
      budget,
      duration,
      skills,
      requirements,
      deadline
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: "Le titre et la description sont obligatoires"
      });
    }

    if (budget && (isNaN(parseFloat(budget)) || parseFloat(budget) < 0)) {
      return res.status(400).json({
        success: false,
        error: "Le budget doit être un nombre positif"
      });
    }

    if (duration && (isNaN(parseInt(duration)) || parseInt(duration) <= 0)) {
      return res.status(400).json({
        success: false,
        error: "La durée doit être un nombre entier positif"
      });
    }

    if (deadline) {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Format de date invalide"
        });
      }

      if (deadlineDate <= new Date()) {
        return res.status(400).json({
          success: false,
          error: "La date limite doit être dans le futur"
        });
      }
    }

    const newProject = await prisma.project.create({
      data: {
        title,
        description,
        budget: budget ? parseFloat(budget) : null,
        duration: duration ? parseInt(duration) : null,
        skills: skills || [],
        requirements: requirements || [],
        deadline: deadline ? new Date(deadline) : null,
        status: 'DRAFT',
        createdById: userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        attachments: true
      }
    });

    res.status(201).json({
      success: true,
      message: "Projet créé avec succès",
      data: newProject
    });

  } catch (error) {
    console.error("❌ Erreur lors de la création du projet:", error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: "Un projet avec ce titre existe déjà"
      });
    }

    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la création du projet"
    });
  }
};

// ✅ Upload de fichiers pour un projet
// ✅ Upload de fichiers pour un projet (Version simplifiée)
export const uploadProjectFiles = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user?.id;

    console.log('Upload request received for project:', projectId);

    // Vérifier que le projet existe
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      cleanupFiles(req.files);
      return res.status(404).json({
        success: false,
        error: "Projet non trouvé"
      });
    }

    // Vérifier les autorisations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    // Si l'utilisateur n'est pas ADMIN, vérifier s'il est un freelancer assigné
    if (!user || user.role !== 'ADMIN') {
      const freelancerProfile = await prisma.freelancerProfile.findUnique({
        where: { userId: userId },
        select: { id: true }
      });

      if (!freelancerProfile) {
        cleanupFiles(req.files);
        return res.status(403).json({
          success: false,
          error: "Accès refusé. Profil freelancer non trouvé."
        });
      }

      const mission = await prisma.mission.findFirst({
        where: {
          projectId: projectId,
          freelancerId: freelancerProfile.id
        }
      });

      if (!mission) {
        cleanupFiles(req.files);
        return res.status(403).json({
          success: false,
          error: "Accès refusé. Vous n'êtes pas assigné à ce projet."
        });
      }
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Aucun fichier fourni"
      });
    }

    const attachments = [];
    for (const file of req.files) {
      try {
        const attachment = await prisma.projectAttachment.create({
          data: {
            name: file.originalname,
            size: formatFileSize(file.size),
            type: file.mimetype,
            url: `/uploads/projects/${file.filename}`,
            isContract: file.originalname.toLowerCase().includes('contract') || file.originalname.toLowerCase().includes('contrat'),
            projectId: projectId
            // Retirer uploadedBy si le champ n'existe pas
          }
        });
        attachments.push(attachment);
      } catch (dbError) {
        console.error('Database error for file:', file.originalname, dbError);
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error("Erreur lors de la suppression du fichier:", unlinkError);
        }
      }
    }

    if (attachments.length === 0) {
      return res.status(500).json({
        success: false,
        error: "Aucun fichier n'a pu être enregistré"
      });
    }

    console.log(`✅ ${attachments.length} fichier(s) uploadé(s) pour le projet ${projectId}`);

    res.status(200).json({
      success: true,
      message: `${attachments.length} fichier(s) uploadé(s) avec succès`,
      data: attachments
    });

  } catch (error) {
    console.error("❌ Erreur lors de l'upload des fichiers:", error);
    cleanupFiles(req.files);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de l'upload des fichiers"
    });
  }
};

// Helper function pour nettoyer les fichiers
function cleanupFiles(files) {
  if (files) {
    files.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkError) {
        console.error("Erreur lors de la suppression du fichier:", unlinkError);
      }
    });
  }
}

// ✅ Récupérer tous les projets
export const getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const projects = await prisma.project.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        proposals: {
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
          }
        },
        attachments: true,
        _count: {
          select: {
            proposals: true,
            contracts: true
          }
        }
      }
    });

    const projectsWithFreelancers = projects.map(project => ({
      ...project,
      assignedFreelancers: project.proposals
        .filter(proposal => proposal.status === 'ACCEPTED')
        .map(proposal => ({
          id: proposal.freelancer.id,
          name: proposal.freelancer.user ? 
            `${proposal.freelancer.user.firstName} ${proposal.freelancer.user.lastName}` : 
            proposal.freelancer.title,
          email: proposal.freelancer.user?.email,
          avatar: proposal.freelancer.user?.avatar,
          status: proposal.status
        })),
      pendingFreelancers: project.proposals
        .filter(proposal => proposal.status === 'PENDING')
        .map(proposal => ({
          id: proposal.freelancer.id,
          name: proposal.freelancer.user ? 
            `${proposal.freelancer.user.firstName} ${proposal.freelancer.user.lastName}` : 
            proposal.freelancer.title,
          email: proposal.freelancer.user?.email,
          avatar: proposal.freelancer.user?.avatar
        }))
    }));

    const total = await prisma.project.count({ where });

    res.status(200).json({
      success: true,
      data: projectsWithFreelancers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des projets:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des projets"
    });
  }
};

// ✅ Récupérer un projet par ID
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        proposals: {
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
          }
        },
        contracts: {
          include: {
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
        },
        attachments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Projet non trouvé"
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error("❌ Erreur lors de la récupération du projet:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération du projet"
    });
  }
};

// ✅ Mettre à jour un projet
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Non autorisé"
      });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: { createdById: true }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Projet non trouvé"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || (user.role !== 'ADMIN' && project.createdById !== userId)) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé. Seuls les administrateurs ou le créateur du projet peuvent le modifier."
      });
    }

    const {
      title,
      description,
      budget,
      duration,
      skills,
      requirements,
      deadline,
      status
    } = req.body;

    const updateData = {};
    const errors = [];

    if (title !== undefined) {
      if (!title.trim()) {
        errors.push("Le titre est requis");
      } else if (title.trim().length < 5) {
        errors.push("Le titre doit contenir au moins 5 caractères");
      } else {
        updateData.title = title.trim();
      }
    }

    if (description !== undefined) {
      if (!description.trim()) {
        errors.push("La description est requise");
      } else if (description.trim().length < 20) {
        errors.push("La description doit contenir au moins 20 caractères");
      } else {
        updateData.description = description.trim();
      }
    }

    if (budget !== undefined) {
      if (budget === null) {
        updateData.budget = null;
      } else {
        const budgetNum = parseFloat(budget);
        if (isNaN(budgetNum) || budgetNum <= 0) {
          errors.push("Le budget doit être un nombre positif");
        } else if (budgetNum < 50) {
          errors.push("Le budget minimum est de 50 $");
        } else {
          updateData.budget = budgetNum;
        }
      }
    }

    if (duration !== undefined) {
      if (duration === null) {
        updateData.duration = null;
      } else {
        const durationNum = parseInt(duration);
        if (isNaN(durationNum) || durationNum <= 0) {
          errors.push("La durée doit être un nombre entier positif");
        } else if (durationNum > 365) {
          errors.push("La durée ne peut pas dépasser 365 jours");
        } else {
          updateData.duration = durationNum;
        }
      }
    }

    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        errors.push("Les compétences doivent être un tableau");
      } else {
        const validSkills = skills.filter(skill => typeof skill === 'string' && skill.trim() !== '');
        if (validSkills.length === 0 && skills.length > 0) {
          errors.push("Les compétences doivent être des chaînes non vides");
        } else {
          updateData.skills = validSkills;
        }
      }
    }

    if (requirements !== undefined) {
      if (!Array.isArray(requirements)) {
        errors.push("Les exigences doivent être un tableau");
      } else {
        const validRequirements = requirements.filter(req => typeof req === 'string' && req.trim() !== '');
        if (validRequirements.length === 0 && requirements.length > 0) {
          errors.push("Les exigences doivent être des chaînes non vides");
        } else {
          updateData.requirements = validRequirements;
        }
      }
    }

    if (deadline !== undefined) {
      if (deadline === null) {
        updateData.deadline = null;
      } else {
        const deadlineDate = new Date(deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(deadlineDate.getTime())) {
          errors.push("Format de date invalide");
        } else if (deadlineDate <= today) {
          errors.push("La date limite doit être dans le futur");
        } else {
          updateData.deadline = deadlineDate;
        }
      }
    }

    if (status !== undefined) {
      const validStatuses = ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        errors.push("Le statut doit être l'un des suivants : DRAFT, PUBLISHED, IN_PROGRESS, COMPLETED, CANCELLED");
      } else {
        updateData.status = status;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors.join("; ")
      });
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Aucune donnée à mettre à jour"
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        proposals: {
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
          }
        },
        contracts: {
          include: {
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
        },
        attachments: true
      }
    });

    res.status(200).json({
      success: true,
      message: "Projet mis à jour avec succès",
      data: updatedProject
    });

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du projet:", error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: "Projet non trouvé"
      });
    }

    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la mise à jour du projet"
    });
  }
};

// ✅ Supprimer un projet
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: "Accès refusé. Seuls les administrateurs peuvent supprimer des projets."
      });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        attachments: true
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Projet non trouvé"
      });
    }

    if (project.attachments && project.attachments.length > 0) {
      project.attachments.forEach(attachment => {
        const filePath = path.join(process.cwd(), 'Uploads/projects/', path.basename(attachment.url));
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`✅ Fichier physique supprimé: ${filePath}`);
          } catch (fileError) {
            console.error("Erreur lors de la suppression du fichier physique:", fileError);
          }
        }
      });
    }

    await prisma.project.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: "Projet supprimé avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur lors de la suppression du projet:", error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: "Projet non trouvé"
      });
    }

    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la suppression du projet"
    });
  }
};

// ✅ Supprimer un fichier attaché à un projet (ADMIN ou utilisateur qui a uploadé)
// ✅ Supprimer un fichier attaché à un projet (Version simplifiée)
export const deleteProjectAttachment = async (req, res) => {
  try {
    const { id: projectId, attachmentId } = req.params;
    const userId = req.user?.id;

    console.log(`Delete request: projectId=${projectId}, attachmentId=${attachmentId}, userId=${userId}`);

    const attachment = await prisma.projectAttachment.findFirst({
      where: {
        id: attachmentId,
        projectId: projectId
      }
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: "Fichier non trouvé"
      });
    }

    // Vérifier les autorisations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    // ADMIN peut toujours supprimer
    if (user?.role === 'ADMIN') {
      // Pas de restriction pour les admins
    } 
    // Pour les freelancers
    else {
      const freelancerProfile = await prisma.freelancerProfile.findUnique({
        where: { userId: userId },
        select: { id: true }
      });

      if (!freelancerProfile) {
        return res.status(403).json({
          success: false,
          error: "Accès refusé. Profil freelancer non trouvé."
        });
      }

      const mission = await prisma.mission.findFirst({
        where: {
          projectId: projectId,
          freelancerId: freelancerProfile.id
        }
      });

      if (!mission) {
        return res.status(403).json({
          success: false,
          error: "Accès refusé. Vous n'êtes pas assigné à ce projet."
        });
      }

      // Empêcher la suppression des contrats
      if (attachment.isContract) {
        return res.status(403).json({
          success: false,
          error: "Accès refusé. Vous ne pouvez pas supprimer les contrats."
        });
      }
    }

    // Supprimer le fichier physique
    const filePath = path.join(process.cwd(), 'Uploads/projects/', path.basename(attachment.url));
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`✅ Fichier physique supprimé: ${filePath}`);
      } catch (fileError) {
        console.error("Erreur lors de la suppression du fichier physique:", fileError);
      }
    }

    // Supprimer l'entrée en base de données
    await prisma.projectAttachment.delete({
      where: { id: attachmentId }
    });

    console.log(`✅ Attachment supprimé: ${attachmentId}`);

    res.status(200).json({
      success: true,
      message: "Fichier supprimé avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur lors de la suppression du fichier:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la suppression du fichier"
    });
  }
};

// ✅ Télécharger un fichier attaché à un projet
export const downloadProjectAttachment = async (req, res) => {
  try {
    const { id: projectId, attachmentId } = req.params;
    const userId = req.user?.id;

    console.log(`Download request: projectId=${projectId}, attachmentId=${attachmentId}, userId=${userId}`);

    const attachment = await prisma.projectAttachment.findFirst({
      where: {
        id: attachmentId,
        projectId: projectId
      }
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: "Fichier non trouvé"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      const freelancerProfile = await prisma.freelancerProfile.findUnique({
        where: { userId: userId },
        select: { id: true }
      });

      if (!freelancerProfile) {
        return res.status(403).json({
          success: false,
          error: "Accès refusé. Profil freelancer non trouvé."
        });
      }

      const missionExists = await prisma.mission.findFirst({
        where: {
          projectId: projectId,
          freelancerId: freelancerProfile.id
        }
      });

      if (!missionExists) {
        return res.status(403).json({
          success: false,
          error: "Accès refusé. Vous n'êtes pas assigné à ce projet."
        });
      }
    }

    const filePath = path.join(process.cwd(), 'Uploads/projects/', path.basename(attachment.url));
    
    console.log(`Looking for file at: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.error(`File not found at path: ${filePath}`);
      return res.status(404).json({
        success: false,
        error: "Fichier physique non trouvé sur le serveur"
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${attachment.name}"`);
    res.setHeader('Content-Type', attachment.type || 'application/octet-stream');
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Erreur lors de la lecture du fichier"
        });
      }
    });

    fileStream.pipe(res);

    console.log(`✅ File download started: ${attachment.name}`);

  } catch (error) {
    console.error("❌ Erreur lors du téléchargement du fichier:", error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Erreur serveur lors du téléchargement du fichier"
      });
    }
  }
};

// ✅ Signer un contrat
// ✅ Signer un contrat
export const signContract = async (req, res) => {
  try {
    const { id: projectId, attachmentId } = req.params;
    const { signatureData } = req.body;
    const userId = req.user?.id;

    console.log(`Contract signing request: projectId=${projectId}, attachmentId=${attachmentId}, userId=${userId}`);

    if (!signatureData) {
      return res.status(400).json({
        success: false,
        error: "Données de signature requises"
      });
    }

    // Vérifier que l'utilisateur est un freelancer assigné au projet
    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { userId: userId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!freelancerProfile) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé. Profil freelancer non trouvé."
      });
    }

    const missionExists = await prisma.mission.findFirst({
      where: {
        projectId: projectId,
        freelancerId: freelancerProfile.id
      }
    });

    if (!missionExists) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé. Vous n'êtes pas assigné à ce projet."
      });
    }

    // Vérifier que le fichier existe et qu'il s'agit d'un contrat
    const attachment = await prisma.projectAttachment.findFirst({
      where: {
        id: attachmentId,
        projectId: projectId
      }
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: "Fichier de contrat non trouvé"
      });
    }

    // Vérifier que le contrat n'est pas déjà signé
    if (attachment.freelancerSignature) {
      return res.status(400).json({
        success: false,
        error: "Ce contrat a déjà été signé"
      });
    }

    // Traitement de la signature sur le PDF
    let signedFilePath = null;
    
    try {
      const originalFilePath = path.join(process.cwd(), 'Uploads/projects/', path.basename(attachment.url));
      
      if (!fs.existsSync(originalFilePath)) {
        return res.status(404).json({
          success: false,
          error: "Fichier original non trouvé"
        });
      }

      // Si c'est un PDF, on peut ajouter la signature directement
      if (attachment.type === 'application/pdf') {
        const pdfBytes = fs.readFileSync(originalFilePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        // Convertir la signature base64 en image
        let signatureImage = null;
        
        if (signatureData.startsWith('data:image/png;base64,')) {
          const signatureBytes = Buffer.from(signatureData.split(',')[1], 'base64');
          signatureImage = await pdfDoc.embedPng(signatureBytes);
        }

        if (signatureImage) {
          // Obtenir toutes les pages
          const pages = pdfDoc.getPages();
          
          // Pour ce contrat spécifique, la signature freelancer est sur la page 2
          const targetPage = pages[1]; // Index 1 pour la page 2
          const { width, height } = targetPage.getSize();

          // Coordonnées exactes pour la section "FREELANCER SIGNATURE"
          // Ces coordonnées sont spécifiques au template de contrat fourni
          const signatureWidth = 120;
          const signatureHeight = 60;
          
          // Position exacte basée sur la structure du contrat
          // Section "FREELANCER SIGNATURE" en bas de la page 2
          const signatureX = 300; // Position horizontale pour aligner avec la section
          const signatureY = 100; // Position verticale pour la zone de signature

          // Dessiner la signature
          targetPage.drawImage(signatureImage, {
            x: signatureX,
            y: signatureY,
            width: signatureWidth,
            height: signatureHeight,
          });

          // Ajouter la date de signature (au format du contrat)
          const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });

          // Ajouter le nom du freelancer
          const freelancerName = `${freelancerProfile.user.firstName} ${freelancerProfile.user.lastName}`;

          // Date - positionnée sous la signature
          targetPage.drawText(currentDate, {
            x: signatureX,
            y: signatureY - 25,
            size: 10,
            color: rgb(0, 0, 0),
          });

          // Nom du freelancer - positionné sous la date
          targetPage.drawText(freelancerName, {
            x: signatureX,
            y: signatureY - 45,
            size: 10,
            color: rgb(0, 0, 0),
          });

          // Sauvegarder le PDF signé
          const signedPdfBytes = await pdfDoc.save();
          const signedFileName = `signed_${Date.now()}_${attachment.name}`;
          signedFilePath = path.join(process.cwd(), 'Uploads/projects/', signedFileName);
          
          fs.writeFileSync(signedFilePath, signedPdfBytes);

          // Mettre à jour l'attachment avec la signature
          const updatedAttachment = await prisma.projectAttachment.update({
            where: { id: attachmentId },
            data: {
              freelancerSignature: signatureData,
              signedAt: new Date(),
              url: `/uploads/projects/${signedFileName}`, // Nouveau chemin vers le fichier signé
              freelancerName: freelancerName,
              signatureDate: currentDate
            }
          });

          console.log(`✅ Contract signed successfully: ${attachmentId}`);

          res.status(200).json({
            success: true,
            message: "Contrat signé avec succès",
            data: updatedAttachment
          });
        } else {
          return res.status(400).json({
            success: false,
            error: "Format de signature non supporté"
          });
        }
      } else {
        // Pour les fichiers non-PDF, sauvegarder juste la signature
        const updatedAttachment = await prisma.projectAttachment.update({
          where: { id: attachmentId },
          data: {
            freelancerSignature: signatureData,
            signedAt: new Date(),
            freelancerName: `${freelancerProfile.user.firstName} ${freelancerProfile.user.lastName}`,
            signatureDate: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })
          }
        });

        res.status(200).json({
          success: true,
          message: "Signature sauvegardée avec succès",
          data: updatedAttachment
        });
      }

    } catch (pdfError) {
      console.error('PDF processing error:', pdfError);
      
      // Fallback: sauvegarder juste la signature sans traitement PDF
      const updatedAttachment = await prisma.projectAttachment.update({
        where: { id: attachmentId },
        data: {
          freelancerSignature: signatureData,
          signedAt: new Date(),
          freelancerName: `${freelancerProfile.user.firstName} ${freelancerProfile.user.lastName}`,
          signatureDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })
        }
      });

      res.status(200).json({
        success: true,
        message: "Signature sauvegardée avec succès (traitement PDF non disponible)",
        data: updatedAttachment
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la signature du contrat:', error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la signature du contrat"
    });
  }
};


