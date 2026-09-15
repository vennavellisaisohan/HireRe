# HireRe

**Intelligent resume-to-job matching for recruiters** — built for the Microsoft College Codeathon.

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
│  port 3456          │                   │  • Skill extractor           │
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
./run.sh                    # starts on http://localhost:8847
```

> First run downloads the `all-MiniLM-L6-v2` embedding model (~90MB). Subsequent runs are fast.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:3456
```

### 3. Demo

1. Open **http://localhost:3456**
2. Click **Demo Data** (pre-loaded)
3. Click **Run Matching**
4. See 4 candidates ranked with scores, matched/missing skills, and explanations

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | Backend URL (default: `http://localhost:8847`) |
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

## Deploy to Vercel (Frontend)

The Next.js app is ready for Vercel. The FastAPI backend must be hosted separately (e.g. [Render](https://render.com)) because Vercel cannot run the Python ML server.

### 1. Deploy backend (Render)

1. Go to [render.com](https://render.com) → **New** → **Blueprint**
2. Connect repo `vennavellisaisohan/HireRe` (uses `render.yaml`)
3. After deploy, copy the API URL (e.g. `https://hirere-api.onrender.com`)

### 2. Deploy frontend (Vercel)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import **vennavellisaisohan/HireRe** from GitHub
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL (no trailing slash)
5. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`. Matching uses the `/api` proxy to your backend.

### CLI (optional)

```bash
cd frontend
npx vercel login
npx vercel --prod
```

Set `NEXT_PUBLIC_API_URL` in the Vercel project settings before deploying.

---

## License

MIT — built for educational/codeathon purposes.
