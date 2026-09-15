"""Human-readable score explanations with optional LLM enhancement."""

from __future__ import annotations

import os

from app.models import ScoreBreakdown, SkillMatch


def _rule_based_explanation(
    candidate_name: str,
    job_title: str,
    overall_score: float,
    matched: list[SkillMatch],
    missing: list[str],
    breakdown: ScoreBreakdown,
    years_experience: float,
    required_years: float,
) -> str:
    lines = [
        f"{candidate_name} scores {overall_score:.0f}/100 for {job_title}.",
        "",
        "Score breakdown:",
        f"• Skill alignment: {breakdown.skill_score:.0f}/100 — "
        f"{len(matched)} of {len(matched) + len(missing)} required skills matched semantically.",
        f"• Document similarity: {breakdown.semantic_score:.0f}/100 — "
        "embedding-based comparison of full resume vs. job description.",
        f"• Experience fit: {breakdown.experience_score:.0f}/100 — "
        f"candidate reports {years_experience:.0f} years vs. ~{required_years:.0f} required.",
    ]

    if matched:
        top = matched[:5]
        match_details = ", ".join(
            f"{m.job_skill}→{m.candidate_skill} ({m.match_type}, {m.similarity:.0%})"
            for m in top
        )
        lines.extend(["", f"Strong matches: {match_details}."])

    if missing:
        lines.extend([
            "",
            f"Gaps to address: {', '.join(missing[:6])}"
            + ("..." if len(missing) > 6 else "")
            + ". Consider upskilling or screening questions on these areas.",
        ])

    if overall_score >= 80:
        lines.append("\nRecommendation: Strong fit — prioritize for interview.")
    elif overall_score >= 60:
        lines.append("\nRecommendation: Good fit with some gaps — worth a phone screen.")
    elif overall_score >= 40:
        lines.append("\nRecommendation: Partial fit — review gaps before proceeding.")
    else:
        lines.append("\nRecommendation: Weak fit for this role based on current profile.")

    return "\n".join(lines)


async def _llm_explanation(prompt: str) -> str | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        import httpx

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You explain resume-job match scores concisely for recruiters. "
                                "Be specific, professional, and under 180 words."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 250,
                    "temperature": 0.3,
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        return None


def generate_explanation(
    candidate_name: str,
    job_title: str,
    overall_score: float,
    matched: list[SkillMatch],
    missing: list[str],
    breakdown: ScoreBreakdown,
    years_experience: float,
    required_years: float,
) -> str:
    return _rule_based_explanation(
        candidate_name,
        job_title,
        overall_score,
        matched,
        missing,
        breakdown,
        years_experience,
        required_years,
    )


async def generate_explanation_async(
    candidate_name: str,
    job_title: str,
    overall_score: float,
    matched: list[SkillMatch],
    missing: list[str],
    breakdown: ScoreBreakdown,
    years_experience: float,
    required_years: float,
) -> str:
    base = _rule_based_explanation(
        candidate_name,
        job_title,
        overall_score,
        matched,
        missing,
        breakdown,
        years_experience,
        required_years,
    )
    prompt = (
        f"Job: {job_title}\nCandidate: {candidate_name}\nScore: {overall_score:.0f}/100\n"
        f"Matched skills: {[m.job_skill for m in matched]}\nMissing: {missing}\n"
        f"Breakdown: skill={breakdown.skill_score}, semantic={breakdown.semantic_score}, "
        f"experience={breakdown.experience_score}\n\n"
        "Write a recruiter-friendly explanation."
    )
    llm = await _llm_explanation(prompt)
    if llm:
        return f"{llm}\n\n— Detailed breakdown —\n{base}"
    return base
