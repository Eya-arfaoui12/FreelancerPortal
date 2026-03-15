import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/dashboard/metrics - Récupérer les métriques globales
export const getGlobalMetrics = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé. Seuls les administrateurs peuvent accéder aux métriques.' });
    }

    // Récupérer le nombre total de freelancers
    const totalFreelancers = await prisma.user.count({
      where: { role: 'FREELANCER' }
    });

    // Récupérer le nombre de freelancers actifs du mois précédent pour calculer le pourcentage
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const freelancersLastMonth = await prisma.user.count({
      where: {
        role: 'FREELANCER',
        createdAt: { lt: lastMonth }
      }
    });

    const freelancersGrowth = freelancersLastMonth > 0 
      ? ((totalFreelancers - freelancersLastMonth) / freelancersLastMonth * 100).toFixed(2)
      : 0;

    // Récupérer le nombre total de projets
    const totalProjects = await prisma.project.count();
    
    const projectsLastMonth = await prisma.project.count({
      where: { createdAt: { lt: lastMonth } }
    });

    const projectsGrowth = projectsLastMonth > 0
      ? ((totalProjects - projectsLastMonth) / projectsLastMonth * 100).toFixed(2)
      : 0;

    // Récupérer le nombre de projets actifs
    const activeProjects = await prisma.project.count({
      where: { status: 'IN_PROGRESS' }
    });

    const activeProjectsLastMonth = await prisma.project.count({
      where: {
        status: 'IN_PROGRESS',
        createdAt: { lt: lastMonth }
      }
    });

    const activeProjectsGrowth = activeProjectsLastMonth > 0
      ? ((activeProjects - activeProjectsLastMonth) / activeProjectsLastMonth * 100).toFixed(2)
      : 0;

    // Récupérer le nombre de contrats en cours (ACTIVE uniquement)
    const ongoingContracts = await prisma.contract.count({
      where: { status: 'ACTIVE' }
    });

    const contractsLastMonth = await prisma.contract.count({
      where: {
        status: 'ACTIVE',
        createdAt: { lt: lastMonth }
      }
    });

    const contractsGrowth = contractsLastMonth > 0
      ? ((ongoingContracts - contractsLastMonth) / contractsLastMonth * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        freelancers: {
          total: totalFreelancers,
          growth: parseFloat(freelancersGrowth),
          trend: parseFloat(freelancersGrowth) >= 0 ? 'up' : 'down'
        },
        projects: {
          total: totalProjects,
          growth: parseFloat(projectsGrowth),
          trend: parseFloat(projectsGrowth) >= 0 ? 'up' : 'down'
        },
        activeProjects: {
          total: activeProjects,
          growth: parseFloat(activeProjectsGrowth),
          trend: parseFloat(activeProjectsGrowth) >= 0 ? 'up' : 'down'
        },
        ongoingContracts: {
          total: ongoingContracts,
          growth: parseFloat(contractsGrowth),
          trend: parseFloat(contractsGrowth) >= 0 ? 'up' : 'down'
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des métriques:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des métriques' });
  }
};

// GET /api/dashboard/monthly-projects - Récupérer les statistiques mensuelles des projets
export const getMonthlyProjectsStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    // Récupérer tous les projets de l'année en cours
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const projects = await prisma.project.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      select: {
        status: true,
        createdAt: true
      }
    });

    // Initialiser les données mensuelles
    const monthlyData = {
      active: Array(12).fill(0),
      completed: Array(12).fill(0),
      pending: Array(12).fill(0)
    };

    // Compter les projets par mois et statut
    projects.forEach(project => {
      const month = new Date(project.createdAt).getMonth();
      
      if (project.status === 'IN_PROGRESS') {
        monthlyData.active[month]++;
      } else if (project.status === 'COMPLETED') {
        monthlyData.completed[month]++;
      } else if (project.status === 'DRAFT' || project.status === 'PUBLISHED') {
        monthlyData.pending[month]++;
      }
    });

    res.status(200).json({
      success: true,
      data: monthlyData
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques mensuelles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/dashboard/monthly-target - Récupérer les données de l'objectif mensuel
export const getMonthlyTarget = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    // Récupérer les contrats du mois en cours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const contracts = await prisma.contract.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      select: {
        rate: true
      }
    });

    // Calculer le revenu total du mois
    const totalRevenue = contracts.reduce((sum, contract) => {
      return sum + (Number(contract.rate) || 0);
    }, 0);

    // Objectif mensuel (peut être configuré)
    const monthlyTarget = 20000;
    const percentage = (totalRevenue / monthlyTarget * 100).toFixed(2);
    
    // Calculer la croissance par rapport au mois dernier
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const lastMonthContracts = await prisma.contract.findMany({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      },
      select: {
        rate: true
      }
    });

    const lastMonthRevenue = lastMonthContracts.reduce((sum, contract) => {
      return sum + (Number(contract.rate) || 0);
    }, 0);

    const growth = lastMonthRevenue > 0
      ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        percentage: parseFloat(percentage),
        target: monthlyTarget,
        revenue: totalRevenue,
        today: Math.round(totalRevenue / new Date().getDate()),
        growth: parseFloat(growth)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'objectif mensuel:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};