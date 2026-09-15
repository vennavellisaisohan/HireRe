# HireRe — Project Context

## Goals

Build a **demo-ready**, **codeathon-shortlist-worthy** intelligent resume-to-job matching system that clearly differentiates from keyword search and works end-to-end without complex setup.

### Success criteria (all met)

- [x] Resume & job parsing (PDF/DOCX/text)
- [x] Skill & experience extraction
- [x] Semantic skill matching (synonyms + embeddings)
- [x] 0–100 compatibility score
- [x] Missing skill identification
- [x] Ranked candidate recommendations
- [x] Human-readable score explanations

---

## Key Decisions

### Why FastAPI + Next.js split?

- **Backend** handles CPU-heavy NLP (embedding model, parsing) in Python where the ML ecosystem lives
- **Frontend** delivers a polished recruiter UX with Next.js/TypeScript for the demo
- Clean API boundary makes it easy to swap UI or integrate with ATS systems later

### Why sentence-transformers (all-MiniLM-L6-v2)?

- Lightweight (~90MB), runs locally without API keys
- Strong semantic similarity for short skill phrases
- TF-IDF fallback if model download fails (offline/demo resilience)

### Why skill ontology + embeddings?

Keyword-only matching fails on:
- Synonyms: `JS` vs `JavaScript`, `K8s` vs `Kubernetes`
- Related skills: candidate has `PyTorch`, job wants `Machine Learning`

Ontology handles known synonyms; embeddings catch semantic neighbors the ontology misses.

### Scoring weights (55/30/15)

Tuned for recruiter intuition:
- **Skills** dominate — recruiters care most about capability fit
- **Semantic document similarity** catches holistic context (project descriptions, role language)
- **Experience** is a tiebreaker, not a gate (junior candidates with strong skills still score reasonably)

### LLM explanations (optional)

Rule-based explanations always work (no API key needed for demo). Optional `OPENAI_API_KEY` prepends an LLM narrative — valuable for judges but not required.

---

## Architecture Overview

```
Parser → Extractor → Matcher → Explainer
   ↑                      ↑
   └── PDF/DOCX/txt       └── Ontology + Embeddings + Weights
```

### Modules

| Module | File | Responsibility |
|--------|------|----------------|
| Parser | `parser.py` | PDF/DOCX/text → raw text |
| Extractor | `extractor.py` | Skills, experience, contact info |
| Ontology | `ontology.py` | Synonym expansion, canonical skill names |
| Matcher | `matcher.py` | Semantic matching + scoring |
| Explainer | `explainer.py` | Human-readable breakdowns |

---

## How to Extend

### Add skills to ontology

Edit `backend/app/ontology.py` → `SKILL_ONTOLOGY` dict. Each key is a canonical skill; values are synonyms/related terms.

### Change scoring weights

Edit `WEIGHTS` in `backend/app/matcher.py`.

### Add new file formats

Extend `parser.py` → `parse_file()` with new suffix handlers.

### Integrate with ATS / HRIS

Use `POST /match/upload` or `/match/text` from your pipeline. Response JSON includes all fields needed for downstream automation.

### Swap embedding model

Change model name in `matcher.py` → `_load_model()`. Any sentence-transformers model works.

### Multi-job ranking (one candidate, many jobs)

Call `match_candidate_to_job()` in a loop over jobs and sort by score — the core function already supports this pattern.

---

## Demo Script for Judges

1. Show landing page — explain value prop (semantic vs keyword)
2. Click **Demo Data** → **Run Matching** (instant, no upload friction)
3. Point out #1 ranked candidate (Alex Chen) — high skill + semantic scores
4. Expand explanation on top candidate
5. Show missing skills on weak candidate (Sam Taylor)
6. Switch to **Upload Files** tab — upload a real PDF resume (optional)
7. Mention: runs fully local, no API keys required

---

## Known Limitations & Future Work

- Skill extraction is pattern-based (not NER/LLM) — fast but may miss uncommon skills
- Experience parsing relies on explicit "X years" phrases
- No persistent storage — stateless API suitable for demo; add DB for production
- Single job vs multiple candidates (inverse also supported in code, UI focuses on recruiter workflow)

---

## Tags

Recruitment · NLP · ML · LLM · Semantic Search
