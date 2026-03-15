import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET /freelancers
export const getFreelancers = async (req, res) => {
  try {
    const freelancers = await prisma.user.findMany({
      where: {
        role: 'FREELANCER',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        isActive: true,
        freelancerProfile: {
          select: {
            rating: true,
            missions: true, 
          },
        },
        projects: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = freelancers.map(f => ({
      id: f.id,
      freelancer: `${f.firstName} ${f.lastName}`,
      firstName: f.firstName,
      lastName: f.lastName,
      email: f.email,
      avatar: f.avatar || null,
      isActive: f.isActive,
      rating: f.freelancerProfile?.rating ?? 0,
      assigned: f.freelancerProfile?.missions?.length > 0 ? 'Yes' : 'No',
      profile: `/freelancers/${f.id}`,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Créer un nouveau freelancer
export const createFreelancer = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      location,
      jobTitle,
      hourlyRate,
      experience,
      skills,
      portfolio,
      linkedin,
      github,
      availability,
      isVerified,
      isActive,
      profilePicture,
      education, // Ajoutez education ici
      certifications // Ajoutez certifications ici
    } = req.body;

    // Vérifier email unique
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Filtrer les skills pour enlever les valeurs null/undefined
    const filteredSkills = (skills || []).filter(skill => skill !== null && skill !== undefined && skill !== '');

    // Mapper l'availability vers les valeurs enum
    const availabilityMap = {
      "available": "AVAILABLE",
      "busy": "BUSY", 
      "unavailable": "UNAVAILABLE"
    };
    const mappedAvailability = availabilityMap[availability] || "AVAILABLE";

    // Création du user + profil
    const newFreelancer = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || "",
        location: location || "",
        role: "FREELANCER",
        avatar: profilePicture || null,
        isActive: isActive !== undefined ? isActive : true,
        isVerified: isVerified !== undefined ? isVerified : false,
        freelancerProfile: {
          create: {
            title: jobTitle || "Freelancer",
            hourlyRate: parseFloat(hourlyRate) || 0,
            experience: parseInt(experience) || 0,
            skills: filteredSkills,
            portfolioUrl: portfolio || "",
            linkedinUrl: linkedin || "",
            githubUrl: github || "",
            availability: mappedAvailability,
            rating: 0,
            reviewCount: 0,
            projectsCompleted: 0,
            languages: ["French"],
            education: education || [], // Utilisez education ici
            certifications: certifications || [] // Utilisez certifications ici
          },
        },
      },
      include: {
        freelancerProfile: true,
      },
    });

    // Retirer le mot de passe de la réponse
    const { password: _, ...userWithoutPassword } = newFreelancer;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("❌ Erreur lors de la création du freelancer:", error);
    res.status(500).json({ error: "Erreur serveur: " + error.message });
  }
};

// GET /freelancers/:id
export const getFreelancerById = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le freelancer avec toutes ses informations
    const freelancer = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'FREELANCER',
      },
      include: {
        freelancerProfile: {
          include: {
            missions: {
              include: {
                project: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    createdAt: true,
                    description: true,
                    budget: true,
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
            },
            projects: {
              include: {
                project: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    budget: true,
                    createdAt: true,
                    deadline: true,
                  },
                },
              },
            },
          },
        },
        reviewsReceived: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!freelancer) {
      return res.status(404).json({ error: 'Freelancer not found' });
    }

    // Format missions like in mission.controller.js
    const formattedMissions = freelancer.freelancerProfile?.missions?.map(mission => ({
      id: mission.id,
      project: mission.project?.title || mission.title,
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
    })) || [];

    // Formater les données pour le frontend
    const formattedFreelancer = {
      id: freelancer.id,
      firstName: freelancer.firstName,
      lastName: freelancer.lastName,
      email: freelancer.email,
      phone: freelancer.phone,
      location: freelancer.location,
      avatar: freelancer.avatar,
      isVerified: freelancer.isVerified,
      isActive: freelancer.isActive,
      createdAt: freelancer.createdAt,
      
      // Informations du profil freelancer
      jobTitle: freelancer.freelancerProfile?.title || 'Freelancer',
      title: freelancer.freelancerProfile?.title || 'Freelancer',
      hourlyRate: freelancer.freelancerProfile?.hourlyRate || 0,
      experience: freelancer.freelancerProfile?.experience || 0,
      skills: freelancer.freelancerProfile?.skills || [],
      portfolio: freelancer.freelancerProfile?.portfolioUrl || '',
      linkedin: freelancer.freelancerProfile?.linkedinUrl || '',
      github: freelancer.freelancerProfile?.githubUrl || '',
      availability: freelancer.freelancerProfile?.availability || 'AVAILABLE',
      rating: freelancer.freelancerProfile?.rating || 0,
      reviewCount: freelancer.freelancerProfile?.reviewCount || 0,
      projectsCompleted: freelancer.freelancerProfile?.projectsCompleted || 0,
      languages: freelancer.freelancerProfile?.languages || [],
      education: freelancer.freelancerProfile?.education || [],
      certifications: freelancer.freelancerProfile?.certifications || [],

      // Missions (formatées comme dans mission.controller.js)
      missions: formattedMissions,
      totalMissions: formattedMissions.length,
      completedMissions: formattedMissions.filter(m => m.status === 'completed').length,
      activeMissions: formattedMissions.filter(m => m.status === 'in-progress').length,

      // Statistiques et données supplémentaires
      totalProjects: freelancer.freelancerProfile?.projects?.length || 0,
      activeProjects: freelancer.freelancerProfile?.projects?.filter(p => p.project.status === 'IN_PROGRESS').length || 0,
      completedProjects: freelancer.freelancerProfile?.projectsCompleted || 0,
      
      // Missions actuelles
      currentMissions: freelancer.freelancerProfile?.missions
        .filter(mission => mission.status === 'IN_PROGRESS')
        .map(mission => ({
          id: mission.id,
          projectId: mission.project?.id,
          projectTitle: mission.project?.title,
          startDate: mission.startDate,
          endDate: mission.deadline,
          status: mission.status,
        })) || [],

      // Avis récents
      recentReviews: freelancer.reviewsReceived.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        client: {
          name: `${review.client?.firstName || ''} ${review.client?.lastName || ''}`,
          avatar: review.client?.avatar,
        },
      })) || [],
    };

    console.log('Formatted Freelancer Response:', {
      id: formattedFreelancer.id,
      totalMissions: formattedFreelancer.totalMissions,
      completedMissions: formattedFreelancer.completedMissions,
      missions: formattedFreelancer.missions.length,
    });

    res.status(200).json(formattedFreelancer);
  } catch (error) {
    console.error('Error fetching freelancer:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// PUT /freelancers/:id
export const updateFreelancer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const {
      firstName,
      lastName,
      email,
      phone,
      location,
      avatar, // URL Cloudinary envoyée depuis le frontend
      isSeen,
      isVerified,
      isActive,
      title,
      hourlyRate,
      experience,
      skills,
      portfolio,
      linkedin,
      github,
      availability,
      languages,
      education,
      certifications
    } = req.body;

    console.log('Update request for freelancer:', id);
    console.log('Request body:', req.body);

    // Vérifier si le freelancer existe
    const existingFreelancer = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'FREELANCER',
      },
      include: {
        freelancerProfile: {
          include: {
            missions: {
              include: {
                project: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
        projects: true,
        reviewsReceived: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!existingFreelancer) {
      return res.status(404).json({ error: 'Freelancer not found' });
    }

    // Vérifier l'unicité de l'email si modifié
    if (email && email !== existingFreelancer.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });
      
      if (existingUser && existingUser.id !== id) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Mapper l'availability
    let mappedAvailability;
    if (availability) {
      const availabilityMap = {
        "available": "AVAILABLE",
        "busy": "BUSY", 
        "unavailable": "UNAVAILABLE",
        "AVAILABLE": "AVAILABLE",
        "BUSY": "BUSY",
        "UNAVAILABLE": "UNAVAILABLE"
      };
      mappedAvailability = availabilityMap[availability] || availability;
    }

    // Filtrer les arrays
    const filteredSkills = Array.isArray(skills) ? skills.filter(skill => skill !== null && skill !== undefined && skill !== '') : undefined;
    const filteredLanguages = Array.isArray(languages) ? languages.filter(lang => lang !== null && lang !== undefined && lang !== '') : undefined;
    const filteredEducation = Array.isArray(education) ? education.filter(edu => edu !== null && edu !== undefined && edu !== '') : undefined;
    const filteredCertifications = Array.isArray(certifications) ? certifications.filter(cert => cert !== null && cert !== undefined && cert !== '') : undefined;

    // Mise à jour
    const updatedFreelancer = await prisma.user.update({
      where: { id: id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(location !== undefined && { location }),
        ...(avatar !== undefined && { avatar }), // URL Cloudinary
        ...(isSeen !== undefined && { isSeen }),
        ...(isVerified !== undefined && { isVerified }),
        ...(isActive !== undefined && { isActive }),
        freelancerProfile: {
          update: {
            ...(title && { title }),
            ...(hourlyRate !== undefined && { hourlyRate: parseFloat(hourlyRate) }),
            ...(experience !== undefined && { experience: parseInt(experience) }),
            ...(skills !== undefined && { skills: filteredSkills }),
            ...(portfolio !== undefined && { portfolioUrl: portfolio }),
            ...(linkedin !== undefined && { linkedinUrl: linkedin }),
            ...(github !== undefined && { githubUrl: github }),
            ...(mappedAvailability && { availability: mappedAvailability }),
            ...(languages !== undefined && { languages: filteredLanguages }),
            ...(education !== undefined && { education: filteredEducation }),
            ...(certifications !== undefined && { certifications: filteredCertifications }),
          },
        },
      },
      include: {
        freelancerProfile: {
          include: {
            missions: {
              include: {
                project: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
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
            },
          },
        },
        projects: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            budget: true,
            createdAt: true,
          },
        },
        reviewsReceived: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    // Format missions
    const formattedMissions = updatedFreelancer.freelancerProfile?.missions?.map(mission => ({
      id: mission.id,
      project: mission.project?.title || mission.title,
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
    })) || [];

    const projects = updatedFreelancer.projects || [];
    const missions = updatedFreelancer.freelancerProfile?.missions || [];
    const reviews = updatedFreelancer.reviewsReceived || [];

    // Formater la réponse
    const formattedFreelancer = {
      id: updatedFreelancer.id,
      firstName: updatedFreelancer.firstName,
      lastName: updatedFreelancer.lastName,
      email: updatedFreelancer.email,
      phone: updatedFreelancer.phone,
      location: updatedFreelancer.location,
      avatar: updatedFreelancer.avatar,
      isVerified: updatedFreelancer.isVerified,
      isActive: updatedFreelancer.isActive,
      createdAt: updatedFreelancer.createdAt,
      
      jobTitle: updatedFreelancer.freelancerProfile?.title || 'Freelancer',
      title: updatedFreelancer.freelancerProfile?.title || 'Freelancer',
      hourlyRate: updatedFreelancer.freelancerProfile?.hourlyRate || 0,
      experience: updatedFreelancer.freelancerProfile?.experience || 0,
      skills: updatedFreelancer.freelancerProfile?.skills || [],
      portfolio: updatedFreelancer.freelancerProfile?.portfolioUrl || '',
      linkedin: updatedFreelancer.freelancerProfile?.linkedinUrl || '',
      github: updatedFreelancer.freelancerProfile?.githubUrl || '',
      availability: updatedFreelancer.freelancerProfile?.availability || 'AVAILABLE',
      rating: updatedFreelancer.freelancerProfile?.rating || 0,
      reviewCount: updatedFreelancer.freelancerProfile?.reviewCount || 0,
      projectsCompleted: updatedFreelancer.freelancerProfile?.projectsCompleted || 0,
      languages: updatedFreelancer.freelancerProfile?.languages || [],
      education: updatedFreelancer.freelancerProfile?.education || [],
      certifications: updatedFreelancer.freelancerProfile?.certifications || [],

      missions: formattedMissions,
      totalMissions: formattedMissions.length,
      completedMissions: formattedMissions.filter(m => m.status === 'completed').length,
      activeMissions: formattedMissions.filter(m => m.status === 'in-progress').length,

      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
      completedProjects: updatedFreelancer.freelancerProfile?.projectsCompleted || 0,
      
      currentMissions: missions
        .filter(mission => mission.status === 'IN_PROGRESS')
        .map(mission => ({
          id: mission.id,
          projectId: mission.project?.id,
          projectTitle: mission.project?.title,
          startDate: mission.startDate,
          endDate: mission.endDate,
          status: mission.status,
        })) || [],

      recentReviews: reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        client: {
          name: `${review.client?.firstName || ''} ${review.client?.lastName || ''}`,
          avatar: review.client?.avatar,
        },
      })) || [],
    };

    console.log('Freelancer updated successfully:', formattedFreelancer.id);

    res.status(200).json({
      message: 'Freelancer updated successfully',
      freelancer: formattedFreelancer
    });
  } catch (error) {
    console.error('Error updating freelancer:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// PATCH /freelancers/:id/block - Bloquer un freelancer
export const blockFreelancer = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Vérifier si le freelancer existe
    const freelancer = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'FREELANCER',
      },
    });

    if (!freelancer) {
      return res.status(404).json({ error: 'Freelancer not found' });
    }

    // Mettre à jour le statut isActive
    const updatedFreelancer = await prisma.user.update({
      where: { id: id },
      data: {
        isActive: isActive !== undefined ? isActive : !freelancer.isActive,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        isVerified: true,
      },
    });

    res.status(200).json({
      message: `Freelancer ${updatedFreelancer.isActive ? 'unblocked' : 'blocked'} successfully`,
      freelancer: updatedFreelancer
    });
  } catch (error) {
    console.error('Error blocking/unblocking freelancer:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// DELETE /freelancers/:id - Supprimer un freelancer
export const deleteFreelancer = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le freelancer existe
    const freelancer = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'FREELANCER',
      },
      include: {
        freelancerProfile: true,
      },
    });

    if (!freelancer) {
      return res.status(404).json({ error: 'Freelancer not found' });
    }

    // Commencer une transaction pour supprimer toutes les données liées
    await prisma.$transaction(async (tx) => {
      // Supprimer le profil freelancer s'il existe
      if (freelancer.freelancerProfile) {
        await tx.freelancerProfile.delete({
          where: { id: freelancer.freelancerProfile.id }
        });
      }

      // Supprimer l'utilisateur
      await tx.user.delete({
        where: { id: id }
      });
    });

    res.status(200).json({
      message: 'Freelancer deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Error deleting freelancer:', error);
    
    // Gestion des erreurs de contrainte de clé étrangère
    if (error.code === 'P2003') {
      return res.status(409).json({ 
        error: 'Cannot delete freelancer. There are related records that need to be handled first.' 
      });
    }
    
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Ajouter cette fonction dans freelancer.controller.js

// GET /freelancers/:id/documents - Récupérer tous les documents d'un freelancer
export const getFreelancerDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    // Vérifier que l'utilisateur connecté est bien le freelancer ou un admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAdmin = user?.role === 'ADMIN';
    const isOwnProfile = userId === id;

    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({ error: 'Accès refusé. Vous ne pouvez consulter que vos propres documents.' });
    }

    // Récupérer le profil freelancer
    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { userId: id },
      select: { id: true },
    });

    if (!freelancerProfile) {
      return res.status(404).json({ error: 'Profil freelancer non trouvé' });
    }

    // Récupérer tous les contrats du freelancer
    const contracts = await prisma.contract.findMany({
      where: {
        freelancerId: freelancerProfile.id,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            attachments: {
              select: {
                id: true,
                name: true,
                size: true,
                type: true,
                url: true,
                isContract: true,
                freelancerSignature: true,
                clientSignature: true,
                signedAt: true,
                createdAt: true,
              },
            },
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            pdfTitle: true,
          },
        },
        attachments: {
          select: {
            id: true,
            name: true,
            size: true,
            type: true,
            url: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formater les données pour correspondre au format attendu par le frontend
    const formattedContracts = contracts.map((contract) => {
      // Combiner les fichiers du contrat et du projet
      const contractFiles = contract.attachments.map(attachment => ({
        name: attachment.name,
        size: attachment.size,
        type: 'contract',
        id: attachment.id,
        url: attachment.url,
        createdAt: attachment.createdAt,
      }));

      const projectFiles = contract.project.attachments.map(attachment => ({
        name: attachment.name,
        size: attachment.size,
        type: attachment.isContract ? 'contract' : 'spec',
        id: attachment.id,
        url: attachment.url,
        createdAt: attachment.createdAt,
        signed: !!attachment.freelancerSignature,
        signedAt: attachment.signedAt,
      }));

      // Déterminer le statut du contrat
      let status;
      switch (contract.status) {
        case 'DRAFT':
          status = 'pending';
          break;
        case 'ACTIVE':
          status = 'active';
          break;
        case 'SIGNED':
          status = 'signed';
          break;
        case 'EXPIRED':
        case 'TERMINATED':
          status = 'expired';
          break;
        default:
          status = 'pending';
      }

      return {
        id: contract.id,
        title: contract.title,
        client: contract.clientName || 'Client',
        status: status,
        dateCreated: contract.createdAt.toISOString().split('T')[0],
        dateSigned: (contract.status === 'ACTIVE' || contract.status === 'COMPLETED') ? 
          contract.updatedAt.toISOString().split('T')[0] : null,
        dateEnded: status === 'expired' ? contract.endDate?.toISOString().split('T')[0] : null,
        amount: Number(contract.rate) || 0,
        type: contract.paymentType === 'FIXED' ? 'Fixed Price' : 
              contract.paymentType === 'HOURLY' ? 'Hourly' : 
              contract.paymentType === 'MONTHLY_RETAINER' ? 'Monthly Retainer' : 'Milestone',
        duration: contract.endDate ? 
          `${Math.ceil((new Date(contract.endDate) - new Date(contract.startDate)) / (1000 * 60 * 60 * 24 * 30))} months` : 
          'Not specified',
        description: contract.description,
        files: [...contractFiles, ...projectFiles],
        projectTitle: contract.project.title,
        projectId: contract.project.id,
        canSign: status === 'pending' && !contract.freelancerSignature,
        freelancerSigned: !!contract.freelancerSignature,
        clientSigned: !!contract.clientSignature,
      };
    });

    // Calculer les statistiques
    const stats = {
      total: formattedContracts.length,
      signed: formattedContracts.filter(c => c.status === 'signed').length,
      active: formattedContracts.filter(c => c.status === 'active').length,
      pending: formattedContracts.filter(c => c.status === 'pending').length,
      expired: formattedContracts.filter(c => c.status === 'expired').length,
    };

    res.status(200).json({
      contracts: formattedContracts,
      stats: stats,
      freelancerId: freelancerProfile.id,
      userId: id,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des documents du freelancer:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des documents' });
  }
};

// Ajouter cette fonction dans freelancer.controller.js

// GET /freelancers/grouped/by-category - Récupérer les freelancers groupés par jobTitle
export const getFreelancersByCategory = async (req, res) => {
  try {
    // Récupérer tous les freelancers actifs avec leur profil
    const freelancers = await prisma.user.findMany({
      where: {
        role: 'FREELANCER',
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        location: true,
        freelancerProfile: {
          select: {
            title: true,
            rating: true,
            projectsCompleted: true,
            skills: true,
            availability: true,
            hourlyRate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Grouper les freelancers par jobTitle (title du profil)
    const groupedByCategory = {};
    const categories = [];

    freelancers.forEach(freelancer => {
      const jobTitle = freelancer.freelancerProfile?.title || 'Other';
      
      if (!groupedByCategory[jobTitle]) {
        groupedByCategory[jobTitle] = [];
        categories.push(jobTitle);
      }

      // Formater les données du freelancer
      groupedByCategory[jobTitle].push({
        id: freelancer.id,
        name: `${freelancer.firstName} ${freelancer.lastName}`,
        firstName: freelancer.firstName,
        lastName: freelancer.lastName,
        title: jobTitle,
        location: freelancer.location || 'Location not specified',
        image: freelancer.avatar || null,
        rating: freelancer.freelancerProfile?.rating || 0,
        projects: freelancer.freelancerProfile?.projectsCompleted || 0,
        skills: freelancer.freelancerProfile?.skills || [],
        availability: freelancer.freelancerProfile?.availability || 'AVAILABLE',
        hourlyRate: freelancer.freelancerProfile?.hourlyRate || 0,
        category: jobTitle,
      });
    });

    // Créer un tableau de catégories avec leurs freelancers
    const categoriesWithFreelancers = categories.map(category => ({
      title: category,
      count: groupedByCategory[category].length,
      freelancers: groupedByCategory[category],
    }));

    // Calculer les statistiques globales
    const stats = {
      totalFreelancers: freelancers.length,
      totalCategories: categories.length,
      categoriesBreakdown: categoriesWithFreelancers.map(cat => ({
        title: cat.title,
        count: cat.count,
      })),
    };

    res.status(200).json({
      success: true,
      categories: categoriesWithFreelancers,
      stats,
      allFreelancers: freelancers.map(f => ({
        id: f.id,
        name: `${f.firstName} ${f.lastName}`,
        firstName: f.firstName,
        lastName: f.lastName,
        title: f.freelancerProfile?.title || 'Other',
        location: f.location || 'Location not specified',
        image: f.avatar || null,
        rating: f.freelancerProfile?.rating || 0,
        projects: f.freelancerProfile?.projectsCompleted || 0,
        skills: f.freelancerProfile?.skills || [],
        availability: f.freelancerProfile?.availability || 'AVAILABLE',
        hourlyRate: f.freelancerProfile?.hourlyRate || 0,
        category: f.freelancerProfile?.title || 'Other',
      })),
    });
  } catch (error) {
    console.error('Error fetching freelancers by category:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error: ' + error.message 
    });
  }
};