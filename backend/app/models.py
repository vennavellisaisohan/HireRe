"""Pydantic models for HireRe API."""

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class SkillMatch(BaseModel):
    job_skill: str
    candidate_skill: Optional[str] = None
    similarity: float = Field(ge=0.0, le=1.0)
    match_type: str  # exact, synonym, semantic


class ScoreBreakdown(BaseModel):
    skill_score: float
    experience_score: float
    semantic_score: float
    weights: Dict[str, float]


class CandidateMatchResult(BaseModel):
    candidate_name: str
    candidate_email: Optional[str] = None
    overall_score: float = Field(ge=0.0, le=100.0)
    matched_skills: List[SkillMatch]
    missing_skills: List[str]
    extra_skills: List[str]
    years_experience: float
    explanation: str
    breakdown: ScoreBreakdown


class MatchResponse(BaseModel):
    job_title: str
    required_skills: List[str]
    candidates: List[CandidateMatchResult]


class TextMatchRequest(BaseModel):
    job_title: str = "Open Role"
    job_description: str
    resumes: List[Dict[str, str]]  # {name, text}


class HealthResponse(BaseModel):
    status: str
    model: str
    version: str = "1.0.0"
