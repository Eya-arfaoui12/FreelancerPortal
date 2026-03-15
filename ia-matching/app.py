from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Tuple
import os
import uvicorn
from sentence_transformers import SentenceTransformer, util
import torch
from functools import lru_cache
import logging
from dotenv import load_dotenv
import time

load_dotenv()

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("match-service")

# Configuration
MODEL_PATH = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
logger.info(f"Chargement du modèle: {MODEL_PATH}")

try:
    model = SentenceTransformer(MODEL_PATH)
    logger.info("Modèle chargé avec succès")
except Exception as e:
    logger.error(f"Erreur lors du chargement du modèle: {e}")
    raise

INTERNAL_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "change-this-token")
MAX_TOP_K = int(os.getenv("MAX_TOP_K", "20"))

# Validation du token
if INTERNAL_TOKEN == "change-this-token":
    logger.warning("Token par défaut utilisé - changez le en production!")

# Modèles de données avec validation
class SkillIn(BaseModel):
    name: str
    weight: Optional[float] = Field(default=1.0, ge=0.0, le=5.0)

class ProjectIn(BaseModel):
    id: str
    title: str
    description: str
    budget: Optional[float] = Field(default=None, ge=0)
    duration: Optional[int] = Field(default=None, ge=1)
    expectedHours: Optional[float] = Field(default=None, ge=1)
    skills: Optional[List[SkillIn]] = Field(default_factory=list)
    requirements: Optional[List[str]] = Field(default_factory=list)
    
    @validator('title', 'description')
    def validate_text_fields(cls, v):
        if not v or not v.strip():
            raise ValueError("Le champ ne peut pas être vide")
        return v.strip()

class FreelancerIn(BaseModel):
    id: str
    fullName: Optional[str] = Field(default="", max_length=100)
    hourlyRate: float = Field(ge=0, le=1000)
    skills: Optional[List[str]] = Field(default_factory=list)
    bio: Optional[str] = Field(default="", max_length=2000)
    title: Optional[str] = Field(default="", max_length=100)
    experience: Optional[int] = Field(default=0, ge=0, le=50)
    rating: Optional[float] = Field(default=0.0, ge=0.0, le=5.0)

class MatchRequest(BaseModel):
    project: ProjectIn
    freelancers: List[FreelancerIn]
    top_k: Optional[int] = Field(default=5, ge=1, le=MAX_TOP_K)
    
    @validator('freelancers')
    def validate_freelancers(cls, v):
        if not v:
            raise ValueError("Au moins un freelancer est requis")
        return v

class MatchOut(BaseModel):
    freelancerId: str
    score: float = Field(ge=0.0, le=1.0)
    breakdown: Dict[str, float]

# Cache pour les embeddings
@lru_cache(maxsize=10000)
def embed_text_cached(text: str):
    """Cache les embeddings pour éviter les recalculs"""
    try:
        emb = model.encode([text], convert_to_tensor=True, normalize_embeddings=True)[0]
        return emb
    except Exception as e:
        logger.error(f"Erreur lors de l'embedding: {e}")
        raise

# Fonctions de scoring améliorées
def skills_score(required: List[SkillIn], freelancer_skills: List[str]) -> float:
    """Score basé sur la correspondance des compétences"""
    if not required:
        return 0.5  # Score neutre si aucune compétence requise
    
    if not freelancer_skills:
        return 0.0  # Pas de compétences = score minimum
    
    try:
        req_names = [s.name.strip().lower() for s in required if s.name.strip()]
        req_weights = torch.tensor([float(s.weight or 1.0) for s in required], dtype=torch.float32)
        
        if not req_names:
            return 0.5
            
        req_emb = model.encode(req_names, convert_to_tensor=True, normalize_embeddings=True)
        
        free_names = [s.strip().lower() for s in freelancer_skills if s.strip()]
        if not free_names:
            return 0.0
            
        free_emb = model.encode(free_names, convert_to_tensor=True, normalize_embeddings=True)
        
        # Calculer les similarités
        sims = util.cos_sim(req_emb, free_emb)
        best_per_req, _ = sims.max(dim=1)
        
        # Pondération par les poids des compétences
        weights = req_weights / (req_weights.sum() + 1e-9)
        score = float((best_per_req * weights).sum().item())
        
        return max(0.0, min(1.0, score))
        
    except Exception as e:
        logger.error(f"Erreur dans skills_score: {e}")
        return 0.0

def semantic_score(project: ProjectIn, freelancer: FreelancerIn) -> float:
    """Score sémantique basé sur la similarité textuelle"""
    try:
        # Construire le texte du projet
        project_text = f"{project.title}\n{project.description}"
        if project.skills:
            skills_text = ", ".join([s.name for s in project.skills])
            project_text += f"\nCompétences: {skills_text}"
        if project.requirements:
            req_text = " ".join(project.requirements)
            project_text += f"\nExigences: {req_text}"
        
        # Construire le texte du freelancer
        freelancer_text = f"{freelancer.title or ''}\n{freelancer.bio or ''}"
        if freelancer.skills:
            skills_text = ", ".join(freelancer.skills)
            freelancer_text += f"\nCompétences: {skills_text}"
        
        # Calculer la similarité
        p_emb = embed_text_cached(project_text)
        f_emb = embed_text_cached(freelancer_text)
        
        sim = float(util.cos_sim(p_emb, f_emb).item())
        
        # Normaliser de [-1, 1] vers [0, 1]
        normalized = (max(-1.0, min(1.0, sim)) + 1.0) / 2.0
        return normalized
        
    except Exception as e:
        logger.error(f"Erreur dans semantic_score: {e}")
        return 0.0

def budget_score(project: ProjectIn, freelancer: FreelancerIn) -> float:
    """Score basé sur l'adéquation budgétaire"""
    try:
        budget = project.budget or 0.0
        
        if budget <= 0:
            return 0.5  # Score neutre si pas de budget défini
        
        # Estimer les heures nécessaires
        expected_hours = project.expectedHours or project.duration * 8 if project.duration else 40
        
        # Calculer le taux horaire cible
        target_rate = budget / expected_hours
        
        if target_rate <= 0:
            return 0.0
        
        # Calculer le ratio
        ratio = freelancer.hourlyRate / target_rate
        
        # Score basé sur le ratio
        if ratio <= 1.0:
            # Freelancer moins cher que le budget
            score = 1.0 - 0.1 * (1.0 - ratio)  # Légère pénalité pour être trop bon marché
        else:
            # Freelancer plus cher que le budget
            score = max(0.0, 1.0 - 0.6 * (ratio - 1.0))
        
        return max(0.0, min(1.0, score))
        
    except Exception as e:
        logger.error(f"Erreur dans budget_score: {e}")
        return 0.0

def experience_score(freelancer: FreelancerIn) -> float:
    """Score basé sur l'expérience"""
    try:
        exp = freelancer.experience or 0
        # Normaliser l'expérience sur 10 ans max
        return min(float(exp), 10.0) / 10.0
    except:
        return 0.0

def rating_score(freelancer: FreelancerIn) -> float:
    """Score basé sur la note"""
    try:
        rating = freelancer.rating or 0.0
        return max(0.0, min(1.0, rating / 5.0))
    except:
        return 0.0

def calculate_final_score(
    project: ProjectIn, 
    freelancer: FreelancerIn,
    weights: Dict[str, float] = None
) -> Tuple[float, Dict[str, float]]:
    """Calcule le score final avec pondération"""
    
    # Poids par défaut
    default_weights = {
        'skills': 0.40,
        'semantic': 0.25,
        'budget': 0.20,
        'rating': 0.10,
        'experience': 0.05
    }
    
    w = weights or default_weights
    
    try:
        # Calculer chaque score
        s_skills = skills_score(project.skills or [], freelancer.skills or [])
        s_semantic = semantic_score(project, freelancer)
        s_budget = budget_score(project, freelancer)
        s_rating = rating_score(freelancer)
        s_experience = experience_score(freelancer)
        
        # Score final pondéré
        final = (
            w['skills'] * s_skills +
            w['semantic'] * s_semantic +
            w['budget'] * s_budget +
            w['rating'] * s_rating +
            w['experience'] * s_experience
        )
        
        # Normalisation
        total_weight = sum(w.values())
        final_normalized = max(0.0, min(1.0, final / total_weight))
        
        breakdown = {
            'skills': round(s_skills, 4),
            'semantic': round(s_semantic, 4),
            'budget': round(s_budget, 4),
            'rating': round(s_rating, 4),
            'experience': round(s_experience, 4)
        }
        
        return final_normalized, breakdown
        
    except Exception as e:
        logger.error(f"Erreur dans calculate_final_score: {e}")
        return 0.0, {
            'skills': 0.0,
            'semantic': 0.0,
            'budget': 0.0,
            'rating': 0.0,
            'experience': 0.0
        }

# FastAPI app
app = FastAPI(
    title="Service de Matching Freelancer",
    description="API de matching intelligent pour freelancers",
    version="1.0.0"
)

def verify_token(token: Optional[str]):
    """Vérification du token d'authentification"""
    if not token:
        logger.warning("Token manquant dans la requête")
        raise HTTPException(
            status_code=401, 
            detail="Token d'authentification requis"
        )
    
    if token != INTERNAL_TOKEN:
        logger.warning(f"Token invalide reçu")
        raise HTTPException(
            status_code=401, 
            detail="Token d'authentification invalide"
        )

@app.post("/match", response_model=List[MatchOut])
async def match_endpoint(
    req: MatchRequest, 
    x_internal_token: Optional[str] = Header(None, alias="X-Internal-Token")
):
    """Endpoint principal de matching"""
    start_time = time.time()
    
    # Vérification du token
    verify_token(x_internal_token)
    
    logger.info(f"Matching pour projet {req.project.id}")
    logger.info(f"Évaluation de {len(req.freelancers)} freelancers")
    
    try:
        scored_freelancers = []
        
        for freelancer in req.freelancers:
            score, breakdown = calculate_final_score(req.project, freelancer)
            
            scored_freelancers.append({
                'freelancerId': freelancer.id,
                'score': score,
                'breakdown': breakdown
            })
        
        # Trier par score décroissant
        scored_freelancers.sort(key=lambda x: x['score'], reverse=True)
        
        # Limiter aux top_k résultats
        top_results = scored_freelancers[:req.top_k]
        
        execution_time = time.time() - start_time
        logger.info(f"Matching terminé en {execution_time:.2f}s")
        logger.info(f"Top score: {top_results[0]['score']:.4f}" if top_results else "Aucun résultat")
        
        return [
            MatchOut(
                freelancerId=item['freelancerId'],
                score=round(item['score'], 6),
                breakdown=item['breakdown']
            ) for item in top_results
        ]
        
    except Exception as e:
        logger.error(f"Erreur lors du matching: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erreur interne lors du matching"
        )

@app.get("/health")
async def health_check():
    """Endpoint de vérification de santé"""
    return {
        "status": "ok",
        "model": MODEL_PATH,
        "version": "1.0.0",
        "max_top_k": MAX_TOP_K
    }

@app.get("/")
async def root():
    """Endpoint racine"""
    return {
        "message": "Service de Matching Freelancer",
        "version": "1.0.0",
        "endpoints": ["/match", "/health"]
    }

# Gestion des erreurs globales
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Erreur non gérée: {exc}")
    return HTTPException(
        status_code=500,
        detail="Erreur interne du serveur"
    )

if __name__ == "__main__":
    logger.info("Démarrage du service de matching")
    uvicorn.run(
        "app:app", 
        host="0.0.0.0", 
        port=8001, 
        log_level="info",
        reload=False  # Désactiver en production
    )