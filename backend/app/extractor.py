"""Extract skills, experience, and metadata from resume/job text."""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.ontology import SKILL_ONTOLOGY, find_canonical, normalize_skill


@dataclass
class ParsedProfile:
    name: str = "Unknown Candidate"
    email: str | None = None
    years_experience: float = 0.0
    skills: list[str] = field(default_factory=list)
    raw_text: str = ""


EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
YEARS_PATTERN = re.compile(
    r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)?",
    re.IGNORECASE,
)
SECTION_HEADERS = re.compile(
    r"(?:^|\n)\s*(skills|technical skills|core competencies|experience|work experience|"
    r"professional experience|employment|projects|education|summary|profile)\s*[:\-]?\s*",
    re.IGNORECASE,
)


def _build_skill_patterns() -> list[tuple[str, re.Pattern[str]]]:
    patterns: list[tuple[str, re.Pattern[str]]] = []
    seen: set[str] = set()
    for canonical, related in SKILL_ONTOLOGY.items():
        terms = {canonical, *related}
        for term in terms:
            norm = normalize_skill(term)
            if norm in seen:
                continue
            seen.add(norm)
            escaped = re.escape(term).replace(r"\ ", r"[\s\-]?")
            patterns.append((find_canonical(term), re.compile(rf"\b{escaped}\b", re.IGNORECASE)))
    extra = [
        "problem solving",
        "data structures",
        "algorithms",
        "object oriented programming",
        "oop",
        "software engineering",
        "cloud computing",
        "full stack",
        "backend development",
        "frontend development",
        "mobile development",
        "android",
        "ios",
        "swift",
        "kotlin",
        "tableau",
        "snowflake",
        "databricks",
        "hadoop",
        "airflow",
        "dbt",
        "selenium",
        "cypress",
        "playwright",
    ]
    for term in extra:
        norm = normalize_skill(term)
        if norm not in seen:
            seen.add(norm)
            escaped = re.escape(term).replace(r"\ ", r"[\s\-]?")
            patterns.append((find_canonical(term), re.compile(rf"\b{escaped}\b", re.IGNORECASE)))
    return patterns


SKILL_PATTERNS = _build_skill_patterns()


def extract_email(text: str) -> str | None:
    match = EMAIL_PATTERN.search(text)
    return match.group(0) if match else None


def extract_name(text: str) -> str:
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    if not lines:
        return "Unknown Candidate"
    first = lines[0]
    if EMAIL_PATTERN.search(first) or len(first) > 60:
        for line in lines[:5]:
            if not EMAIL_PATTERN.search(line) and 2 <= len(line.split()) <= 5:
                return line.title()
        return "Unknown Candidate"
    return first.title()


def extract_years_experience(text: str) -> float:
    matches = YEARS_PATTERN.findall(text)
    if not matches:
        return 0.0
    return max(float(m) for m in matches)


def extract_skills(text: str) -> list[str]:
    found: dict[str, str] = {}
    for canonical, pattern in SKILL_PATTERNS:
        if pattern.search(text):
            key = find_canonical(canonical)
            if key not in found:
                found[key] = canonical
    return sorted(found.keys())


def extract_profile(text: str, default_name: str | None = None) -> ParsedProfile:
    return ParsedProfile(
        name=default_name or extract_name(text),
        email=extract_email(text),
        years_experience=extract_years_experience(text),
        skills=extract_skills(text),
        raw_text=text,
    )
