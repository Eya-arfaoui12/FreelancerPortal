import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

const PYTHON_MATCH_URL = process.env.PYTHON_MATCH_URL || "http://localhost:8001/match";
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

export const matchProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Validation du projectId
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "ID du projet requis"
      });
    }

    // 1️⃣ Récupérer le projet depuis Prisma
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Projet non trouvé"
      });
    }

    // 2️⃣ Récupérer les freelancers avec leurs données utilisateur
    const freelancers = await prisma.freelancerProfile.findMany({
      where: { 
        availability: { not: "UNAVAILABLE" },
        user: {
          isActive: true
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (freelancers.length === 0) {
      return res.json([]);
    }

    // 3️⃣ Construire le payload pour le service Python
    const projectPayload = {
      id: project.id,
      title: project.title,
      description: project.description,
      budget: project.budget || 0,
      duration: project.duration || 0,
      expectedHours: project.duration ? project.duration * 8 : 40,
      skills: (project.skills || []).map(skill => ({ name: skill, weight: 1 })),
      requirements: project.requirements || []
    };

    const freelancersPayload = freelancers.map(f => ({
      id: f.id,
      fullName: f.user ? `${f.user.firstName} ${f.user.lastName}` : f.title || `Freelancer ${f.id}`,
      hourlyRate: f.hourlyRate || 0,
      skills: f.skills || [],
      bio: f.bio || "",
      title: f.title || "",
      experience: f.experience || 0,
      rating: f.rating || 0
    }));

    const body = {
      project: projectPayload,
      freelancers: freelancersPayload,
      top_k: 10
    };

    console.log(`🤖 Envoi de ${freelancersPayload.length} freelancers pour matching...`);

    // 4️⃣ Appel au service Python avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(PYTHON_MATCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": INTERNAL_TOKEN
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Python service error (${response.status}):`, errorText);
        
        return res.status(500).json({
          success: false,
          message: "Erreur du service de matching IA",
          detail: response.status === 401 ? "Token d'authentification invalide" : "Service indisponible"
        });
      }

      const matches = await response.json();

      // Vérifier le format de la réponse
      if (!Array.isArray(matches)) {
        console.error("Format de réponse invalide:", matches);
        return res.status(500).json({
          success: false,
          message: "Format de réponse invalide du service IA"
        });
      }

      // 5️⃣ Enrichir les données avec les infos complètes du freelancer
      const enrichedMatches = await Promise.all(
        matches.map(async (match) => {
          const freelancer = await prisma.freelancerProfile.findUnique({
            where: { id: match.freelancerId },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          });

          if (!freelancer) {
            return null;
          }

          return {
            ...match,
            fullName: freelancer.user ? 
              `${freelancer.user.firstName} ${freelancer.user.lastName}` : 
              freelancer.title || `Freelancer ${match.freelancerId}`,
            title: freelancer.title || "Développeur",
            hourlyRate: freelancer.hourlyRate || 0,
            rating: freelancer.rating || 0,
            experience: freelancer.experience || 0,
            skills: freelancer.skills || []
          };
        })
      );

      // Filtrer les résultats null
      const validMatches = enrichedMatches.filter(match => match !== null);

      console.log(`✅ Matching terminé: ${validMatches.length} résultats`);

      return res.json(validMatches);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error("Timeout du service de matching");
        return res.status(504).json({
          success: false,
          message: "Timeout du service de matching IA"
        });
      }

      throw fetchError;
    }

  } catch (error) {
    console.error("❌ Erreur lors du matching:", error);
    
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors du matching",
      error: error.message
    });
  }
};