import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fetch from 'node-fetch'; // Ajout pour récupérer les images de signature

const prisma = new PrismaClient();

// Fonction helper pour traiter les images base64 (à ajouter si elle n'existe pas)
function processBase64Image(base64String) {
  if (!base64String) return null;
  
  // Supprimer le préfixe data:image/... si présent
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  return base64Data;
}

// GET /contracts - Récupérer tous les contrats
export const getContracts = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé. Seuls les administrateurs peuvent accéder aux contrats.' });
    }

    // Récupérer tous les contrats avec relations
    const contracts = await prisma.contract.findMany({
      include: {
        freelancer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        template: {
          select: {
            id: true,
            pdfTitle: true,
            defaultTerms: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formater les données pour correspondre au format du frontend
    const formattedContracts = contracts.map((contract) => {
  console.log('Contract rate from DB:', contract.rate, typeof contract.rate);
  const formattedRate = Number(contract.rate) || 0;
  console.log('Formatted rate:', formattedRate, typeof formattedRate);
  
  return {
    id: contract.id,
    title: contract.title,
    freelancer: {
      name: `${contract.freelancer.user.firstName} ${contract.freelancer.user.lastName}`,
      avatar: contract.freelancer.user.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      email: contract.freelancer.user.email,
    },
    project: {
      title: contract.project.title,
      id: contract.project.id,
    },
    startDate: contract.startDate.toISOString().split('T')[0],
    endDate: contract.endDate ? contract.endDate.toISOString().split('T')[0] : null,
    rate: formattedRate,
    value: formattedRate,
    status: contract.status,
    createdAt: contract.createdAt.toISOString(),
    template: contract.template ? {
      id: contract.template.id,
      pdfTitle: contract.template.pdfTitle,
      defaultTerms: contract.template.defaultTerms,
    } : null,
    clientSignature: contract.clientSignature,
    freelancerSignature: contract.freelancerSignature,
  };
});

    res.status(200).json(formattedContracts);
  } catch (error) {
    console.error('Erreur lors de la récupération des contrats:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des contrats' });
  }
};

// POST /contracts - Créer un nouveau contrat
export const createContract = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé. Seuls les administrateurs peuvent créer des contrats.' });
    }

    const {
      title,
      description,
      type,
      freelancerUserId,
      projectId,
      startDate,
      endDate,
      value,
      paymentSchedule,
      terms,
      clientName = 'MNM Consulting',
      clientAddress = 'Company Address',
      clientEmail = 'mnmconsulting@gmail.com',
      templateId,
      clientSignature, // Nouveau champ
      freelancerSignature, // Nouveau champ
    } = req.body;

    // Validation des champs requis
    if (!title || !description || !type || !freelancerUserId || !projectId || !startDate || !value || !paymentSchedule) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    // Mapper le type vers PaymentType enum
    let paymentType;
    switch (type) {
      case 'fixed':
        paymentType = 'FIXED';
        break;
      case 'hourly':
        paymentType = 'HOURLY';
        break;
      case 'retainer':
        paymentType = 'MONTHLY_RETAINER';
        break;
      default:
        return res.status(400).json({ error: 'Type de contrat invalide' });
    }

    // Vérifier le freelancer
    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { userId: freelancerUserId },
    });

    if (!freelancerProfile) {
      return res.status(404).json({ error: 'Freelancer non trouvé' });
    }

    // Vérifier le projet
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Vérifier le template si fourni
    let template = null;
    if (templateId) {
      template = await prisma.contractTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        return res.status(404).json({ error: 'Template non trouvé' });
      }
    }

    // Créer le contrat
    const newContract = await prisma.contract.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        rate: parseFloat(value),
        paymentType,
        status: 'ACTIVE',
        terms,
        clientName,
        clientAddress,
        clientEmail,
        freelancerId: freelancerProfile.id,
        projectId,
        createdById: userId,
        clientUserId: null,
        templateId: templateId || null,
        clientSignature: clientSignature || null,
        freelancerSignature: freelancerSignature || null,
      },
      include: {
        freelancer: {
          include: {
            user: true,
          },
        },
        project: true,
        template: true,
      },
    });

    // Formater la réponse
    const formattedContract = {
        id: newContract.id,
        title: newContract.title,
        freelancer: {
            name: `${newContract.freelancer.user.firstName} ${newContract.freelancer.user.lastName}`,
            avatar: newContract.freelancer.user.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            email: newContract.freelancer.user.email,
        },
        project: {
            title: newContract.project.title,
            id: newContract.project.id,
        },
        startDate: newContract.startDate.toISOString().split('T')[0],
        endDate: newContract.endDate ? newContract.endDate.toISOString().split('T')[0] : null,
        // CORRECTION : s'assurer que rate et value sont des nombres
        rate: Number(newContract.rate) || 0,
        value: Number(newContract.rate) || 0,
        status: newContract.status, // Garder le format original
        createdAt: newContract.createdAt.toISOString(),
        template: newContract.template ? {
            id: newContract.template.id,
            pdfTitle: newContract.template.pdfTitle,
            defaultTerms: newContract.template.defaultTerms,
        } : null,
        clientSignature: newContract.clientSignature,
        freelancerSignature: newContract.freelancerSignature,
        };

    res.status(201).json(formattedContract);
  } catch (error) {
    console.error('Erreur lors de la création du contrat:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du contrat' });
  }
};

// GET /contracts/:id - Récupérer un contrat par ID
export const getContractById = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier admin
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        freelancer: {
          include: {
            user: true,
          },
        },
        project: true,
        template: {
          select: {
            id: true,
            pdfTitle: true,
            defaultTerms: true,
          },
        },
      },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contrat non trouvé' });
    }

    // Formater pour frontend
    const formatted = {
      id: contract.id,
      title: contract.title,
      description: contract.description,
      type: contract.paymentType.toLowerCase() === 'fixed' ? 'fixed' : contract.paymentType.toLowerCase() === 'hourly' ? 'hourly' : 'retainer',
      freelancerId: contract.freelancer.userId,
      projectId: contract.projectId,
      startDate: contract.startDate.toISOString().split('T')[0],
      endDate: contract.endDate ? contract.endDate.toISOString().split('T')[0] : '',
      value: contract.rate,
      paymentSchedule: contract.paymentType.toLowerCase() === 'fixed' ? 'milestone' : contract.paymentType.toLowerCase() === 'hourly' ? 'weekly' : 'monthly',
      terms: contract.terms || '',
      clientName: contract.clientName,
      clientAddress: contract.clientAddress,
      clientEmail: contract.clientEmail,
      status: contract.status.toLowerCase(),
      template: contract.template ? {
        id: contract.template.id,
        pdfTitle: contract.template.pdfTitle,
        defaultTerms: contract.template.defaultTerms,
      } : null,
      clientSignature: contract.clientSignature,
      freelancerSignature: contract.freelancerSignature,
    };

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Erreur lors de la récupération du contrat:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT /contracts/:id - Mettre à jour un contrat
export const updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const {
      title,
      description,
      type,
      freelancerUserId,
      projectId,
      startDate,
      endDate,
      value,
      paymentSchedule,
      terms,
      clientName,
      clientAddress,
      clientEmail,
      status,
      templateId,
      clientSignature, // Nouveau champ
      freelancerSignature, // Nouveau champ
    } = req.body;

    // Mapper paymentType
    let paymentType;
    if (type) {
      switch (type) {
        case 'fixed':
          paymentType = 'FIXED';
          break;
        case 'hourly':
          paymentType = 'HOURLY';
          break;
        case 'retainer':
          paymentType = 'MONTHLY_RETAINER';
          break;
        default:
          return res.status(400).json({ error: 'Type de contrat invalide' });
      }
    }

    let freelancerId;
    if (freelancerUserId) {
      const freelancerProfile = await prisma.freelancerProfile.findUnique({
        where: { userId: freelancerUserId },
      });
      if (!freelancerProfile) {
        return res.status(404).json({ error: 'Freelancer non trouvé' });
      }
      freelancerId = freelancerProfile.id;
    }

    // Vérifier projet si modifié
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return res.status(404).json({ error: 'Projet non trouvé' });
      }
    }

    // Vérifier template si modifié
    let template = null;
    if (templateId) {
      template = await prisma.contractTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        return res.status(404).json({ error: 'Template non trouvé' });
      }
    }

    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(paymentType && { paymentType }),
      ...(freelancerId && { freelancerId }),
      ...(projectId && { projectId }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(value && { rate: parseFloat(value) }),
      ...(terms !== undefined && { terms }),
      ...(clientName && { clientName }),
      ...(clientAddress && { clientAddress }),
      ...(clientEmail && { clientEmail }),
      ...(status && { status: status.toUpperCase() }),
      ...(templateId !== undefined && { templateId: templateId || null }),
      ...(clientSignature !== undefined && { clientSignature: clientSignature || null }),
      ...(freelancerSignature !== undefined && { freelancerSignature: freelancerSignature || null }),
    };

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        freelancer: {
          include: { user: true },
        },
        project: true,
        template: true,
      },
    });

    // Formater la réponse
    const formatted = {
      id: updatedContract.id,
      freelancer: {
        name: `${updatedContract.freelancer.user.firstName} ${updatedContract.freelancer.user.lastName}`,
        avatar: updatedContract.freelancer.user.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        email: updatedContract.freelancer.user.email,
      },
      project: {
        title: updatedContract.project.title,
        id: updatedContract.project.id,
      },
      startDate: updatedContract.startDate.toISOString().split('T')[0],
      endDate: updatedContract.endDate ? updatedContract.endDate.toISOString().split('T')[0] : null,
      value: updatedContract.rate,
      status: updatedContract.status.toLowerCase(),
      createdAt: updatedContract.createdAt.toISOString().split('T')[0],
      template: updatedContract.template ? {
        id: updatedContract.template.id,
        pdfTitle: updatedContract.template.pdfTitle,
        defaultTerms: updatedContract.template.defaultTerms,
      } : null,
      clientSignature: updatedContract.clientSignature,
      freelancerSignature: updatedContract.freelancerSignature,
    };

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du contrat:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /contracts/:id - Supprimer un contrat
export const deleteContract = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) {
      return res.status(404).json({ error: 'Contrat non trouvé' });
    }

    await prisma.contract.delete({ where: { id } });

    res.status(200).json({ message: 'Contrat supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du contrat:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /contract-templates - Récupérer les templates
export const getContractTemplates = async (req, res) => {
  try {
    console.log('📜 Endpoint /api/contracts/templates appelé');
    const templates = await prisma.contractTemplate.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log('Templates récupérés:', templates);
    res.status(200).json(templates);
  } catch (error) {
    console.error('Erreur lors de la récupération des templates:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/// GET /contracts/:id/pdf - Générer un PDF pour un contrat
export const generateContractPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { 
        freelancer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        project: true,
        template: {
          select: {
            pdfTitle: true,
            name: true,
          },
        },
      },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Créer un document PDF avec design amélioré
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50
    });

    const filename = `Contract_${contract.title || 'Untitled'}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // ============ PAGE 1 ============
    
    // Titre centré avec style amélioré
    const pageWidth = doc.page.width;
    const title = contract.template?.pdfTitle || 'FIXED PRICE CONTRACT AGREEMENT';
    const contractId = `Contract ID: CT-${contract.id.slice(-4)}`;
    
    // Titre principal centré
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(title, 0, 40, { 
         align: 'center',
         width: pageWidth 
       });

    // ID du contrat centré
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#7f8c8d')
       .text(contractId, 0, 65, { 
         align: 'center',
         width: pageWidth 
       });

    // Ligne de séparation élégante
    doc.strokeColor('#bdc3c7')
       .lineWidth(1.5)
       .moveTo(80, 85)
       .lineTo(pageWidth - 80, 85)
       .stroke();

    // Reset couleur pour le contenu
    doc.fillColor('#2c3e50');

    // PARTIES avec style amélioré
    let currentY = 110;
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#34495e')
       .text('PARTIES', 50, currentY);

    currentY += 25;
    
    // Section Client avec mise en forme
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Client:', 50, currentY);
    
    doc.font('Helvetica')
       .text(contract.clientName, 100, currentY);

    currentY += 15;
    doc.text(contract.clientAddress || 'Company Address', 100, currentY);
    
    currentY += 15;
    doc.fillColor('#3498db')
       .text(contract.clientEmail, 100, currentY);

    currentY += 25;
    
    // Section Freelancer
    doc.fillColor('#2c3e50')
       .font('Helvetica-Bold')
       .text('Freelancer:', 50, currentY);
    
    doc.font('Helvetica')
       .text(`${contract.freelancer.user.firstName} ${contract.freelancer.user.lastName}`, 120, currentY);

    currentY += 35;

    // CONTRACT DETAILS avec style amélioré
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#34495e')
       .text('CONTRACT DETAILS', 50, currentY);

    currentY += 25;

    // Détails en deux colonnes pour optimiser l'espace
    const leftColumn = 50;
    const rightColumn = 300;
    
    // Colonne gauche
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text('Title:', leftColumn, currentY);
    doc.font('Helvetica').text(contract.title || 'test', leftColumn + 50, currentY);

    doc.font('Helvetica-Bold').text('Type:', leftColumn, currentY + 15);
    doc.font('Helvetica').text(contract.paymentType.toLowerCase(), leftColumn + 50, currentY + 15);

    doc.font('Helvetica-Bold').text('Template:', leftColumn, currentY + 30);
    doc.font('Helvetica').text(contract.template?.name || 'Standard Fixed Price', leftColumn + 50, currentY + 30);

    // Colonne droite
    doc.font('Helvetica-Bold').text('Start Date:', rightColumn, currentY);
    doc.font('Helvetica').text(new Date(contract.startDate).toLocaleDateString('en-CA'), rightColumn + 60, currentY);

    doc.font('Helvetica-Bold').text('End Date:', rightColumn, currentY + 15);
    doc.font('Helvetica').text(contract.endDate ? new Date(contract.endDate).toLocaleDateString('en-CA') : 'Not specified', rightColumn + 60, currentY + 15);

    doc.font('Helvetica-Bold').text('Value:', rightColumn, currentY + 30);
    doc.font('Helvetica').fillColor('#27ae60').text(contract.rate ? `$${contract.rate}` : 'Not specified', rightColumn + 60, currentY + 30);

    currentY += 60;

    // Description sur toute la largeur
    doc.fillColor('#2c3e50').font('Helvetica-Bold').text('Description:', leftColumn, currentY);
    currentY += 15;
    doc.font('Helvetica').text(contract.description || 'test test', leftColumn, currentY, {
      width: 450,
      lineGap: 3
    });

    currentY += 40;

    doc.font('Helvetica-Bold').text('Payment Schedule:', leftColumn, currentY);
    doc.font('Helvetica').text(getPaymentScheduleText(contract.paymentType), leftColumn + 100, currentY);

    currentY += 40;

    // TERMS & CONDITIONS avec encadré
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#34495e')
       .text('TERMS & CONDITIONS', 50, currentY);

    currentY += 25;

    // Encadré pour les termes
    doc.rect(45, currentY - 5, 500, 80)
       .strokeColor('#bdc3c7')
       .lineWidth(1)
       .stroke();

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#2c3e50')
       .text('• Fixed price of ' + (contract.rate ? `$${contract.rate}` : '[amount]'), 55, currentY + 10);
    
    doc.text('• Payment upon completion of each milestone', 55, currentY + 25);
    doc.text('• Scope changes may affect pricing', 55, currentY + 40);
    doc.text('• All work must be completed according to specifications', 55, currentY + 55);

    // Footer page 1 - SEULEMENT le numéro de page
    doc.fontSize(9)
       .fillColor('#7f8c8d')
       .text('Page 1 of 2', 50, 750);

    // ============ PAGE 2 ============
    doc.addPage();

    // Titre page 2 centré
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('CONTRACT SIGNATURES', 0, 50, { 
         align: 'center',
         width: pageWidth 
       });

    // Ligne de séparation
    doc.strokeColor('#bdc3c7')
       .lineWidth(1.5)
       .moveTo(80, 75)
       .lineTo(pageWidth - 80, 75)
       .stroke();

    currentY = 110;

    // Section Client Signature - CENTRÉ
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#34495e')
       .text('CLIENT SIGNATURE', 0, currentY, { 
         align: 'center',
         width: pageWidth 
       });

    currentY += 30;

    // Signature du client - Centré
    if (contract.clientSignature) {
      try {
        const base64Data = processBase64Image(contract.clientSignature);
        if (base64Data) {
          const buffer = Buffer.from(base64Data, 'base64');
          const centerX = (pageWidth - 200) / 2; // Centrer la signature de 200px de largeur
          doc.image(buffer, centerX, currentY, { width: 200, height: 50 });
        }
      } catch (error) {
        doc.fontSize(10).fillColor('#e74c3c').text('(Signature error)', 0, currentY + 20, { 
          align: 'center',
          width: pageWidth 
        });
      }
    } else {
      // Ligne de signature centrée
      const lineWidth = 300;
      const lineX = (pageWidth - lineWidth) / 2;
      doc.strokeColor('#bdc3c7')
         .moveTo(lineX, currentY + 25)
         .lineTo(lineX + lineWidth, currentY + 25)
         .stroke();
    }

    // Informations du client - Centrées
    doc.fontSize(10)
       .fillColor('#2c3e50')
       .font('Helvetica-Bold')
       .text('Date: ' + new Date().toLocaleDateString('en-US'), 0, currentY + 60, {
         align: 'center',
         width: pageWidth 
       });

    doc.font('Helvetica')
       .text('Name: ' + contract.clientName, 0, currentY + 75, {
         align: 'center',
         width: pageWidth 
       });

    // Footer page 2 - Numéro de page à gauche et signature freelancer à droite
    doc.fontSize(9)
       .fillColor('#7f8c8d')
       .text('Page 2 of 2', 50, 750);
    
    // Signature du freelancer dans le footer (côté droit)
    if (contract.freelancerSignature) {
      try {
        const base64Data = processBase64Image(contract.freelancerSignature);
        if (base64Data) {
          const buffer = Buffer.from(base64Data, 'base64');
          // Positionner la signature du freelancer dans le coin droit du footer
          doc.fontSize(8)
             .fillColor('#2c3e50')
             .font('Helvetica-Bold')
             .text('Freelancer:', 400, 730);
          
          doc.font('Helvetica')
             .text(`${contract.freelancer.user.firstName} ${contract.freelancer.user.lastName}`, 400, 742);
          
          doc.text(`Signed: ${new Date().toLocaleDateString('en-US')}`, 400, 754);
          
          // Mini signature dans le footer à droite
          doc.image(buffer, 450, 725, { width: 80, height: 25 });
        }
      } catch (error) {
        console.error('Error processing freelancer signature in footer:', error);
        // Si erreur, afficher juste le texte sans signature
        doc.fontSize(8)
           .fillColor('#2c3e50')
           .font('Helvetica-Bold')
           .text('Freelancer:', 400, 730);
        
        doc.font('Helvetica')
           .text(`${contract.freelancer.user.firstName} ${contract.freelancer.user.lastName}`, 400, 742);
        
        doc.text('Signature: Pending', 400, 754);
      }
    } else {
      // Si pas de signature du freelancer, afficher "Pending"
      doc.fontSize(8)
         .fillColor('#7f8c8d')
         .font('Helvetica')
         .text('Freelancer signature', 400, 750);
    }

    // Finaliser le document
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la génération du PDF' });
  }
};

// Fonction helper pour convertir le type de paiement en texte
function getPaymentScheduleText(paymentType) {
  switch (paymentType) {
    case 'FIXED': return 'Upon milestone completion';
    case 'HOURLY': return 'Weekly invoicing';
    case 'MONTHLY_RETAINER': return 'Monthly payment';
    default: return 'Upon milestone completion';
  }
}

// PATCH /contracts/:id/sign - Permettre au freelancer de signer le contrat
export const signContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { freelancerSignature } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    if (!freelancerSignature) {
      return res.status(400).json({ error: 'Signature requise' });
    }

    // Trouver le contrat et vérifier que l'utilisateur est le freelancer assigné
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        freelancer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contrat non trouvé' });
    }

    // Vérifier que l'utilisateur connecté est bien le freelancer du contrat
    if (contract.freelancer.userId !== userId) {
      return res.status(403).json({ error: 'Accès refusé. Vous ne pouvez signer que vos propres contrats.' });
    }

    // Vérifier que le contrat n'est pas déjà signé par le freelancer
    if (contract.freelancerSignature) {
      return res.status(400).json({ error: 'Ce contrat a déjà été signé' });
    }

    // Mettre à jour le contrat avec la signature du freelancer
    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        freelancerSignature,
        // Optionnel : mettre à jour le statut du contrat
        status: 'ACTIVE', // ou tout autre statut approprié
      },
      include: {
        freelancer: {
          include: {
            user: true,
          },
        },
        project: true,
        template: true,
      },
    });

    // Formater la réponse
    const formatted = {
      id: updatedContract.id,
      title: updatedContract.title,
      freelancer: {
        name: `${updatedContract.freelancer.user.firstName} ${updatedContract.freelancer.user.lastName}`,
        avatar: updatedContract.freelancer.user.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        email: updatedContract.freelancer.user.email,
      },
      project: {
        title: updatedContract.project.title,
        id: updatedContract.project.id,
      },
      status: updatedContract.status,
      clientSignature: updatedContract.clientSignature,
      freelancerSignature: updatedContract.freelancerSignature,
      signedAt: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      message: 'Contrat signé avec succès',
      data: formatted,
    });
  } catch (error) {
    console.error('Erreur lors de la signature du contrat:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la signature du contrat' });
  }
};