export interface SkillMatch {
  job_skill: string;
  candidate_skill: string | null;
  similarity: number;
  match_type: string;
}

export interface ScoreBreakdown {
  skill_score: number;
  experience_score: number;
  semantic_score: number;
  weights: Record<string, number>;
}

export interface CandidateMatchResult {
  candidate_name: string;
  candidate_email: string | null;
  overall_score: number;
  matched_skills: SkillMatch[];
  missing_skills: string[];
  extra_skills: string[];
  years_experience: number;
  explanation: string;
  breakdown: ScoreBreakdown;
}

export interface MatchResponse {
  job_title: string;
  required_skills: string[];
  candidates: CandidateMatchResult[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error(
      "Cannot reach the matching API. Start the backend: cd backend && source .venv/bin/activate && ./run.sh"
    );
  }
}

export async function matchFromText(
  jobTitle: string,
  jobDescription: string,
  resumes: { name: string; text: string }[]
): Promise<MatchResponse> {
  const res = await apiFetch(`${API_BASE}/match/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_title: jobTitle,
      job_description: jobDescription,
      resumes,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === "string" ? err.detail : "Matching failed");
  }
  return res.json();
}

export async function matchFromUpload(
  jobTitle: string,
  jobDescription: string,
  jobFile: File | null,
  resumeFiles: File[]
): Promise<MatchResponse> {
  const form = new FormData();
  form.append("job_title", jobTitle);
  if (jobFile) {
    form.append("job_file", jobFile);
  } else {
    form.append("job_description", jobDescription);
  }
  resumeFiles.forEach((f) => form.append("resume_files", f));

  const res = await apiFetch(`${API_BASE}/match/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === "string" ? err.detail : "Upload matching failed");
  }
  return res.json();
}

export async function checkHealth(): Promise<{ status: string; model: string }> {
  const res = await apiFetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("API unavailable");
  return res.json();
}
