import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/freelancer-dashboard/stats - Statistiques principales du freelancer
export const getFreelancerStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    // Récupérer le profil freelancer
    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { 
        id: true, 
        rating: true,
        reviewCount: true,
        projectsCompleted: true
      }
    });

    if (!freelancerProfile) {
      return res.status(404).json({ error: 'Profil freelancer non trouvé' });
    }

    // Période de comparaison (30 derniers jours)
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setDate(lastMonth.getDate() - 30);
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

    // 1. Revenu total basé sur les missions complétées
    const completedMissions = await prisma.mission.findMany({
      where: {
        freelancerId: freelancerProfile.id,
        status: 'COMPLETED'
      },
      select: { 
        budget: true,
        createdAt: true 
      }
    });

    // Revenu total de toutes les missions complétées
    const totalRevenue = completedMissions.reduce((sum, m) => sum + (Number(m.budget) || 0), 0);

    // Revenu du mois en cours
    const currentMonthMissions = completedMissions.filter(m => m.createdAt >= lastMonth);
    const currentRevenue = currentMonthMissions.reduce((sum, m) => sum + (Number(m.budget) || 0), 0);

    // Revenu du mois précédent
    const previousMonthMissions = completedMissions.filter(m => 
      m.createdAt >= twoMonthsAgo && m.createdAt < lastMonth
    );
    const previousRevenue = previousMonthMissions.reduce((sum, m) => sum + (Number(m.budget) || 0), 0);

    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : (currentRevenue > 0 ? 100 : 0);

    // 2. Total des missions (au lieu de seulement les actives)
    const totalMissions = await prisma.mission.count({
      where: {
        freelancerId: freelancerProfile.id
      }
    });

    const previousTotalMissions = await prisma.mission.count({
      where: {
        freelancerId: freelancerProfile.id,
        createdAt: { lt: lastMonth }
      }
    });

    const missionsChange = totalMissions - previousTotalMissions;

    // 3. Satisfaction client (rating)
    const satisfactionChange = 0.2; // Peut être calculé dynamiquement

    // 4. Temps de réponse moyen (simulé pour l'instant)
    const avgResponseTime = 4.2;
    const responseTimeChange = -1.3;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: {
          value: totalRevenue,
          formatted: `${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: `${revenueChange >= 0 ? '+' : ''}${revenueChange}%`,
          isPositive: parseFloat(revenueChange) >= 0
        },
        totalMissions: {
          value: totalMissions,
          change: `${missionsChange >= 0 ? '+' : ''}${missionsChange}`,
          isPositive: missionsChange >= 0
        },
        clientSatisfaction: {
          value: freelancerProfile.rating || 0,
          formatted: `${(freelancerProfile.rating || 0).toFixed(1)}/5`,
          change: `+${satisfactionChange}`,
          isPositive: true
        },
        avgResponseTime: {
          value: avgResponseTime,
          formatted: `${avgResponseTime}h`,
          change: `${responseTimeChange}h`,
          isPositive: true
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/freelancer-dashboard/revenue - Données de revenu mensuel
export const getRevenueData = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!freelancerProfile) {
      return res.status(404).json({ error: 'Profil freelancer non trouvé' });
    }

    // Récupérer les 7 derniers mois
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const monthsData = [];

    for (let i = 6; i >= 0; i--) {
      const targetMonth = currentMonth - i;
      const targetYear = currentYear + Math.floor(targetMonth / 12);
      const normalizedMonth = ((targetMonth % 12) + 12) % 12;

      const startDate = new Date(targetYear, normalizedMonth, 1);
      const endDate = new Date(targetYear, normalizedMonth + 1, 0, 23, 59, 59);

      // Calculer le revenu des missions complétées dans ce mois
      const missions = await prisma.mission.findMany({
        where: {
          freelancerId: freelancerProfile.id,
          status: 'COMPLETED',
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: { budget: true }
      });

      const revenue = missions.reduce((sum, m) => sum + (Number(m.budget) || 0), 0);

      monthsData.push({
        month: startDate.toLocaleString('en-US', { month: 'short' }),
        revenue: revenue
      });
    }

    res.status(200).json({
      success: true,
      data: monthsData
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du revenu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/freelancer-dashboard/mission-status - Distribution des missions par statut
export const getMissionStatusDistribution = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!freelancerProfile) {
      return res.status(404).json({ error: 'Profil freelancer non trouvé' });
    }

    // Récupérer toutes les missions avec leurs statuts
    const missions = await prisma.mission.findMany({
      where: { freelancerId: freelancerProfile.id },
      select: { status: true }
    });

    // Compter les missions par statut
    const statusCounts = {
      'COMPLETED': 0,
      'IN_PROGRESS': 0,
      'PENDING': 0,
      'ON_HOLD': 0,
      'CANCELLED': 0,
      'DRAFT': 0
    };

    missions.forEach(mission => {
      if (statusCounts.hasOwnProperty(mission.status)) {
        statusCounts[mission.status]++;
      }
    });

    const total = missions.length || 1;

    // Formater pour le graphique (seulement les statuts avec des valeurs)
    const distribution = Object.entries(statusCounts)
      .filter(([status, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        value: Math.round((count / total) * 100),
        count: count
      }));

    res.status(200).json({
      success: true,
      data: distribution
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la distribution:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/freelancer-dashboard/weekly-performance - Performance hebdomadaire
export const getWeeklyPerformance = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!freelancerProfile) {
      return res.status(404).json({ error: 'Profil freelancer non trouvé' });
    }

    // Derniers 7 jours
    const weekData = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const dayIndex = startOfDay.getDay();
      const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];

      const completed = await prisma.mission.count({
        where: {
          freelancerId: freelancerProfile.id,
          status: 'COMPLETED',
          updatedAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      const pending = await prisma.mission.count({
        where: {
          freelancerId: freelancerProfile.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      weekData.push({
        day: dayName,
        completed,
        pending
      });
    }

    res.status(200).json({
      success: true,
      data: weekData
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la performance:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/freelancer-dashboard/recent-projects - Projets récents
export const getRecentProjects = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!freelancerProfile) {
      return res.status(404).json({ error: 'Profil freelancer non trouvé' });
    }

    const missions = await prisma.mission.findMany({
      where: { freelancerId: freelancerProfile.id },
      include: {
        project: {
          select: {
            title: true,
            description: true
          }
        },
        client: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const formattedProjects = missions.map(mission => ({
      id: mission.id,
      name: mission.project?.title || mission.title,
      client: `${mission.client.firstName} ${mission.client.lastName}`,
      deadline: mission.deadline.toISOString(),
      progress: mission.progress,
      status: mission.status.toLowerCase().replace('_', '-'),
      budget: mission.budget
    }));

    res.status(200).json({
      success: true,
      data: formattedProjects
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des projets récents:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};