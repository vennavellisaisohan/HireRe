"""HireRe FastAPI backend — intelligent resume-to-job matching."""

from __future__ import annotations

import os
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.extractor import ParsedProfile, extract_profile
from app.matcher import get_model_name, match_candidate_to_job
from app.models import CandidateMatchResult, HealthResponse, MatchResponse, TextMatchRequest
from app.parser import parse_file, parse_text

app = FastAPI(
    title="HireRe API",
    description="Semantic resume-to-job matching for recruiters",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3456,http://127.0.0.1:3456").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", model=get_model_name())


@app.post("/match/text", response_model=MatchResponse)
async def match_from_text(payload: TextMatchRequest) -> MatchResponse:
    if not payload.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required")
    if not payload.resumes:
        raise HTTPException(status_code=400, detail="At least one resume is required")

    job_profile = extract_profile(parse_text(payload.job_description))
    results: list[CandidateMatchResult] = []

    for resume in payload.resumes:
        text = resume.get("text", "")
        name = resume.get("name") or None
        if not text.strip():
            continue
        candidate = extract_profile(parse_text(text), default_name=name)
        results.append(
            match_candidate_to_job(payload.job_title, job_profile, candidate)
        )

    results.sort(key=lambda r: r.overall_score, reverse=True)
    return MatchResponse(
        job_title=payload.job_title,
        required_skills=job_profile.skills,
        candidates=results,
    )


@app.post("/match/upload", response_model=MatchResponse)
async def match_from_upload(
    job_title: Annotated[str, Form()] = "Open Role",
    job_description: Annotated[str | None, Form()] = None,
    job_file: UploadFile | None = File(None),
    resume_files: list[UploadFile] = File(...),
) -> MatchResponse:
    if job_file:
        job_bytes = await job_file.read()
        job_text = parse_file(job_file.filename or "job.txt", job_bytes)
    elif job_description and job_description.strip():
        job_text = parse_text(job_description)
    else:
        raise HTTPException(status_code=400, detail="Provide job description text or file")

    if not resume_files:
        raise HTTPException(status_code=400, detail="Upload at least one resume")

    job_profile = extract_profile(job_text)
    results: list[CandidateMatchResult] = []

    for upload in resume_files:
        content = await upload.read()
        if not content:
            continue
        text = parse_file(upload.filename or "resume.txt", content)
        candidate = extract_profile(text, default_name=PathStem(upload.filename))
        results.append(match_candidate_to_job(job_title, job_profile, candidate))

    results.sort(key=lambda r: r.overall_score, reverse=True)
    return MatchResponse(
        job_title=job_title,
        required_skills=job_profile.skills,
        candidates=results,
    )


def PathStem(filename: str | None) -> str | None:
    if not filename:
        return None
    from pathlib import Path

    return Path(filename).stem.replace("_", " ").replace("-", " ").title()
