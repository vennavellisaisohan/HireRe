"""Tests for HireRe semantic matching core logic."""

from app.extractor import extract_profile
from app.matcher import match_candidate_to_job
from app.ontology import expand_skill, find_canonical


JOB = """
Senior Full Stack Engineer — 5+ years experience required.

We need strong Python, React, PostgreSQL, Docker, and AWS skills.
Experience with FastAPI, CI/CD, and agile/scrum is a plus.
"""

RESUME_STRONG = """
Alex Chen
alex.chen@email.com
5 years of professional experience

Skills: Python, JavaScript, React, Node.js, PostgreSQL, Docker, AWS, Git, Agile
Built REST APIs with FastAPI and deployed via CI/CD pipelines.
"""

RESUME_PARTIAL = """
Jordan Lee
jordan@email.com
2 years experience

Skills: Java, Spring Boot, MySQL, HTML, CSS
Some exposure to Python scripting.
"""

RESUME_WEAK = """
Sam Taylor
sam@email.com

Skills: Excel, Power BI, data analysis, communication
1 year of business analyst experience.
"""


def test_ontology_synonym_expansion():
    expanded = expand_skill("js")
    assert "javascript" in expanded or "js" in expanded
    assert find_canonical("nodejs") == find_canonical("node.js")


def test_skill_extraction():
    profile = extract_profile(RESUME_STRONG)
    assert "python" in profile.skills
    assert "react" in profile.skills
    assert profile.years_experience >= 5


def test_strong_candidate_scores_highest():
    job = extract_profile(JOB)
    strong = extract_profile(RESUME_STRONG, default_name="Alex Chen")
    partial = extract_profile(RESUME_PARTIAL, default_name="Jordan Lee")
    weak = extract_profile(RESUME_WEAK, default_name="Sam Taylor")

    r_strong = match_candidate_to_job("Senior Full Stack Engineer", job, strong)
    r_partial = match_candidate_to_job("Senior Full Stack Engineer", job, partial)
    r_weak = match_candidate_to_job("Senior Full Stack Engineer", job, weak)

    assert r_strong.overall_score > r_partial.overall_score
    assert r_partial.overall_score > r_weak.overall_score
    assert r_strong.overall_score >= 60
    assert len(r_strong.matched_skills) >= 4


def test_missing_skills_identified():
    job = extract_profile(JOB)
    weak = extract_profile(RESUME_WEAK, default_name="Sam Taylor")
    result = match_candidate_to_job("Senior Full Stack Engineer", job, weak)
    assert len(result.missing_skills) > 0
    assert "python" in result.missing_skills or "react" in result.missing_skills


def test_explanation_generated():
    job = extract_profile(JOB)
    strong = extract_profile(RESUME_STRONG, default_name="Alex Chen")
    result = match_candidate_to_job("Senior Full Stack Engineer", job, strong)
    assert "Alex Chen" in result.explanation
    assert result.breakdown.skill_score > 0
