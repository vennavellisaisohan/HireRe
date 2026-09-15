# HireRe

**Intelligent resume-to-job matching for recruiters.**

**Live demo:** **[https://hirere.vercel.app](https://hirere.vercel.app)**

HireRe goes beyond keyword matching. It uses **semantic embeddings**, a **skill ontology** (synonyms & related skills), and **explainable scoring** to rank candidates against job descriptions in seconds.

---

## Problem

Recruiters screening hundreds of resumes rely on brittle keyword search. A candidate with "Node.js" won't match a job requiring "JavaScript." Related skills like PyTorch → Machine Learning are missed entirely. There's no transparency into *why* a candidate scored well.

## Solution

HireRe parses resumes and job descriptions (PDF/DOCX/text), extracts skills and experience, then computes a **0–100 compatibility score** using:

| Component | Weight | What it measures |
|-----------|--------|------------------|
| Skill alignment | 55% | Ontology + embedding match per required skill |
| Semantic fit | 30% | Full-document embedding similarity |
| Experience | 15% | Years of experience vs. job requirement |

Every result includes **matched skills**, **missing skills**, **bonus skills**, and a **human-readable explanation**.

---

## Architecture

```
┌─────────────────────┐     REST API      ┌──────────────────────────────┐
│  Next.js Frontend   │ ◄──────────────► │  FastAPI Backend (port 8847)  │
│  TypeScript/Tailwind│                   │  • Parser (PDF/DOCX/text)    │
│  (Vercel / port 3456)│                  │  • Skill extractor           │
└─────────────────────┘                   │  • Sentence-transformers     │
                                          │  • Skill ontology            │
                                          │  • Scorer + explainer        │
                                          └──────────────────────────────┘
```

**Stack:** Next.js 15 · TypeScript · Tailwind CSS · shadcn-style UI · FastAPI · sentence-transformers · scikit-learn

---

## Quick Start (Demo in 2 minutes)

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
./run.sh                    # starts backend on port 8847
```

> First run downloads the `all-MiniLM-L6-v2` embedding model (~90MB). Subsequent runs are fast.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # starts frontend on port 3456
```

### 3. Demo

1. Open **[https://hirere.vercel.app](https://hirere.vercel.app)**
2. Click **Demo** (pre-loaded)
3. Click **Analyze candidates**
4. See 4 candidates ranked with scores, matched/missing skills, and explanations

> Candidate matching requires the FastAPI backend. Set `NEXT_PUBLIC_API_URL` on Vercel to your deployed API URL.

---

## Deployment

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | [hirere.vercel.app](https://hirere.vercel.app) | Next.js on Vercel |
| Backend | Deploy separately | Use `render.yaml` or your preferred host |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | Backend API URL for the frontend |
| `OPENAI_API_KEY` | No | Enables LLM-enhanced explanations (rule-based fallback always works) |
| `OPENAI_MODEL` | No | Default: `gpt-4o-mini` |
| `CORS_ORIGINS` | No | Comma-separated origins for backend CORS |
| `PORT` | No | Backend port (default: `8847`) |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check + embedding model name |
| POST | `/match/text` | JSON: job description + resume texts |
| POST | `/match/upload` | Multipart: job file/text + resume files |

---

## How Matching Works

1. **Parse** — Extract text from PDF (pypdf), DOCX (python-docx), or plain text
2. **Extract** — Regex + ontology patterns pull skills, years of experience, email, name
3. **Match skills** — For each job skill:
   - Exact/synonym match via ontology (`js` → `javascript`, `k8s` → `kubernetes`)
   - Semantic match via cosine similarity of embeddings (threshold 0.62)
4. **Score** — Weighted combination of skill, semantic, and experience scores
5. **Explain** — Rule-based breakdown; optional LLM narrative if `OPENAI_API_KEY` is set

---

## Sample Data

Pre-loaded demo data and files in `backend/sample_data/`:

- `job_fullstack.txt`
- `resume_alex_chen.txt` (strong fit)
- `resume_priya_sharma.txt` (strong ML/full-stack fit)
- `resume_jordan_lee.txt` (partial fit)
- `resume_sam_taylor.txt` (weak fit)

---

## Tests

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
```

---

## Codeathon Pitch (60 seconds)

> "Recruiters waste hours on keyword search that misses great candidates. HireRe uses semantic AI — not just keywords — to match resumes to jobs. We parse any resume format, expand skills through an ontology so Node.js matches JavaScript, use embeddings to catch related skills like PyTorch and Machine Learning, and return a transparent 0–100 score with matched skills, gaps, and an explanation recruiters can trust. Demo: upload one job and four resumes, get an instant ranked shortlist."

---

## Project Structure

```
HireRe/
├── backend/           # FastAPI + NLP/ML engine
│   ├── app/           # Parser, extractor, matcher, explainer
│   ├── sample_data/   # Demo resumes & job descriptions
│   └── tests/         # Core matching tests
├── frontend/          # Next.js recruiter UI
├── docs/              # Architecture & extension guide
└── README.md
```

---

## License

MIT — built for educational/codeathon purposes.
