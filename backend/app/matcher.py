"""Semantic skill matching engine using embeddings + ontology."""

from __future__ import annotations

import logging
from functools import lru_cache

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.extractor import ParsedProfile
from app.models import CandidateMatchResult, ScoreBreakdown, SkillMatch
from app.ontology import expand_skill, find_canonical, normalize_skill

logger = logging.getLogger(__name__)

SEMANTIC_THRESHOLD = 0.62
EXACT_THRESHOLD = 0.95

WEIGHTS = {
    "skill": 0.55,
    "semantic": 0.30,
    "experience": 0.15,
}


@lru_cache(maxsize=1)
def _load_model():
    try:
        from sentence_transformers import SentenceTransformer

        model = SentenceTransformer("all-MiniLM-L6-v2")
        return model, "all-MiniLM-L6-v2"
    except Exception as exc:
        logger.warning("Embedding model unavailable, using TF-IDF fallback: %s", exc)
        return None, "tfidf-fallback"


def embed_texts(texts: list[str]) -> np.ndarray:
    model, _ = _load_model()
    if model is not None:
        return np.array(model.encode(texts, normalize_embeddings=True))
    return _tfidf_embed(texts)


@lru_cache(maxsize=1)
def _tfidf_vectorizer():
    from sklearn.feature_extraction.text import TfidfVectorizer

    return TfidfVectorizer(ngram_range=(1, 2), min_df=1)


def _tfidf_embed(texts: list[str]) -> np.ndarray:
    vectorizer = _tfidf_vectorizer()
    matrix = vectorizer.fit_transform(texts)
    dense = matrix.toarray()
    norms = np.linalg.norm(dense, axis=1, keepdims=True)
    norms[norms == 0] = 1
    return dense / norms


def _skill_similarity(job_skill: str, candidate_skills: list[str]) -> tuple[str | None, float, str]:
    job_canon = find_canonical(job_skill)
    job_expanded = expand_skill(job_skill)

    for c_skill in candidate_skills:
        c_canon = find_canonical(c_skill)
        c_expanded = expand_skill(c_skill)
        if job_canon == c_canon or job_expanded & c_expanded:
            return c_skill, 1.0, "synonym" if job_canon != normalize_skill(c_skill) else "exact"

    if not candidate_skills:
        return None, 0.0, "none"

    texts = [job_skill, *candidate_skills]
    embeddings = embed_texts(texts)
    job_vec = embeddings[0:1]
    cand_vecs = embeddings[1:]
    sims = cosine_similarity(job_vec, cand_vecs)[0]
    best_idx = int(np.argmax(sims))
    best_score = float(sims[best_idx])
    if best_score >= SEMANTIC_THRESHOLD:
        return candidate_skills[best_idx], best_score, "semantic"
    return None, best_score, "none"


def _experience_score(required_years: float, candidate_years: float) -> float:
    if required_years <= 0:
        return 1.0 if candidate_years > 0 else 0.7
    ratio = candidate_years / required_years
    if ratio >= 1.0:
        return 1.0
    if ratio >= 0.75:
        return 0.85
    if ratio >= 0.5:
        return 0.65
    if ratio >= 0.25:
        return 0.4
    return 0.2


def _semantic_document_score(job_text: str, resume_text: str) -> float:
    if not job_text.strip() or not resume_text.strip():
        return 0.0
    embeddings = embed_texts([job_text[:4000], resume_text[:4000]])
    return float(cosine_similarity(embeddings[0:1], embeddings[1:2])[0][0])


def match_candidate_to_job(
    job_title: str,
    job_profile: ParsedProfile,
    candidate: ParsedProfile,
    required_years: float | None = None,
) -> CandidateMatchResult:
    req_years = required_years if required_years is not None else job_profile.years_experience
    job_skills = job_profile.skills or extract_skills_from_text(job_profile.raw_text)
    cand_skills = candidate.skills

    matched: list[SkillMatch] = []
    missing: list[str] = []
    skill_scores: list[float] = []

    for skill in job_skills:
        matched_skill, sim, match_type = _skill_similarity(skill, cand_skills)
        if matched_skill and sim >= SEMANTIC_THRESHOLD:
            matched.append(
                SkillMatch(
                    job_skill=skill,
                    candidate_skill=matched_skill,
                    similarity=round(min(sim, 1.0), 3),
                    match_type=match_type if match_type != "none" else "semantic",
                )
            )
            skill_scores.append(min(sim, 1.0))
        else:
            missing.append(skill)
            skill_scores.append(sim * 0.35 if sim > 0 else 0.0)

    skill_score = sum(skill_scores) / len(skill_scores) if skill_scores else 0.0
    exp_score = _experience_score(req_years, candidate.years_experience)
    sem_score = _semantic_document_score(job_profile.raw_text, candidate.raw_text)

    overall = (
        WEIGHTS["skill"] * skill_score
        + WEIGHTS["semantic"] * sem_score
        + WEIGHTS["experience"] * exp_score
    ) * 100

    job_skill_set = {find_canonical(s) for s in job_skills}
    extra = sorted(
        s for s in cand_skills if find_canonical(s) not in job_skill_set
    )

    breakdown = ScoreBreakdown(
        skill_score=round(skill_score * 100, 1),
        experience_score=round(exp_score * 100, 1),
        semantic_score=round(sem_score * 100, 1),
        weights=WEIGHTS,
    )

    from app.explainer import generate_explanation

    explanation = generate_explanation(
        candidate_name=candidate.name,
        job_title=job_title,
        overall_score=overall,
        matched=matched,
        missing=missing,
        breakdown=breakdown,
        years_experience=candidate.years_experience,
        required_years=req_years,
    )

    return CandidateMatchResult(
        candidate_name=candidate.name,
        candidate_email=candidate.email,
        overall_score=round(overall, 1),
        matched_skills=matched,
        missing_skills=missing,
        extra_skills=extra[:12],
        years_experience=candidate.years_experience,
        explanation=explanation,
        breakdown=breakdown,
    )


def extract_skills_from_text(text: str) -> list[str]:
    from app.extractor import extract_skills

    return extract_skills(text)


def get_model_name() -> str:
    _, name = _load_model()
    return name
