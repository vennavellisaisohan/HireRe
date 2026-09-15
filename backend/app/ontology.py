"""Skill ontology with synonyms and related skills for semantic expansion."""

from __future__ import annotations

SKILL_ONTOLOGY: dict[str, list[str]] = {
    "python": ["python3", "py", "django", "flask", "fastapi", "pandas", "numpy"],
    "javascript": ["js", "typescript", "ts", "node.js", "nodejs", "react", "vue", "angular", "next.js"],
    "typescript": ["ts", "javascript", "react", "next.js", "angular"],
    "react": ["reactjs", "react.js", "frontend", "redux", "next.js"],
    "node.js": ["nodejs", "express", "javascript", "backend"],
    "java": ["spring", "spring boot", "jvm", "kotlin"],
    "sql": ["mysql", "postgresql", "postgres", "sqlite", "database", "t-sql", "pl/sql"],
    "postgresql": ["postgres", "sql", "database"],
    "mongodb": ["nosql", "document database", "mongo"],
    "aws": ["amazon web services", "ec2", "s3", "lambda", "cloud"],
    "azure": ["microsoft azure", "cloud", "azure devops"],
    "docker": ["containerization", "containers", "kubernetes", "k8s"],
    "kubernetes": ["k8s", "docker", "orchestration", "helm"],
    "machine learning": ["ml", "deep learning", "ai", "artificial intelligence", "neural networks"],
    "deep learning": ["ml", "tensorflow", "pytorch", "neural networks"],
    "tensorflow": ["tf", "deep learning", "ml", "keras"],
    "pytorch": ["deep learning", "ml", "neural networks"],
    "nlp": ["natural language processing", "text mining", "llm", "transformers"],
    "llm": ["large language models", "gpt", "nlp", "generative ai", "gen ai"],
    "git": ["github", "gitlab", "version control", "bitbucket"],
    "ci/cd": ["continuous integration", "continuous deployment", "devops", "jenkins", "github actions"],
    "devops": ["ci/cd", "docker", "kubernetes", "infrastructure", "terraform"],
    "rest api": ["restful", "api development", "web services", "microservices"],
    "microservices": ["rest api", "distributed systems", "architecture"],
    "agile": ["scrum", "kanban", "sprint planning"],
    "scrum": ["agile", "sprint", "product owner"],
    "communication": ["presentation", "collaboration", "teamwork", "stakeholder management"],
    "leadership": ["team lead", "mentoring", "management", "people management"],
    "data analysis": ["analytics", "statistics", "excel", "visualization", "power bi"],
    "excel": ["spreadsheet", "data analysis", "microsoft office"],
    "power bi": ["business intelligence", "data visualization", "dashboards"],
    "c++": ["cpp", "systems programming"],
    "c#": ["csharp", ".net", "dotnet", "asp.net"],
    ".net": ["dotnet", "c#", "asp.net"],
    "go": ["golang", "backend"],
    "rust": ["systems programming", "backend"],
    "html": ["css", "frontend", "web development"],
    "css": ["html", "tailwind", "frontend", "styling"],
    "tailwind": ["css", "frontend", "ui design"],
    "figma": ["ui/ux", "design", "prototyping"],
    "ui/ux": ["user experience", "user interface", "design", "figma"],
    "testing": ["unit testing", "qa", "test automation", "pytest", "jest"],
    "pytest": ["testing", "unit testing", "python"],
    "jest": ["testing", "javascript", "unit testing"],
    "security": ["cybersecurity", "authentication", "oauth", "encryption"],
    "oauth": ["authentication", "security", "jwt"],
    "redis": ["caching", "in-memory database", "nosql"],
    "graphql": ["api", "rest alternative", "apollo"],
    "spark": ["big data", "apache spark", "data engineering"],
    "kafka": ["event streaming", "message queue", "data engineering"],
    "terraform": ["infrastructure as code", "iac", "devops", "cloud"],
    "linux": ["unix", "bash", "shell scripting", "system administration"],
    "bash": ["shell scripting", "linux", "automation"],
}


def normalize_skill(skill: str) -> str:
    return skill.strip().lower().replace("_", " ").replace("-", " ")


def expand_skill(skill: str) -> set[str]:
    """Return canonical skill plus synonyms and related terms."""
    key = normalize_skill(skill)
    expanded = {key, skill.strip().lower()}
    for canonical, related in SKILL_ONTOLOGY.items():
        canon_norm = normalize_skill(canonical)
        related_norm = {normalize_skill(r) for r in related}
        if key == canon_norm or key in related_norm:
            expanded.add(canon_norm)
            expanded.update(related_norm)
    return expanded


def find_canonical(skill: str) -> str:
    key = normalize_skill(skill)
    for canonical, related in SKILL_ONTOLOGY.items():
        canon_norm = normalize_skill(canonical)
        related_norm = {normalize_skill(r) for r in related}
        if key == canon_norm or key in related_norm:
            return canon_norm
    return key
