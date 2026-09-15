"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { checkHealth, matchFromText, matchFromUpload, type MatchResponse } from "@/lib/api";
import { DEMO_JOB, DEMO_RESUMES } from "@/lib/demo-data";
import { ResultsPanel } from "@/components/results-panel";
import {
  Brain,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";

type Mode = "demo" | "paste" | "upload";

export function MatcherApp() {
  const [mode, setMode] = useState<Mode>("demo");
  const [jobTitle, setJobTitle] = useState("Senior Full Stack Engineer");
  const [jobDescription, setJobDescription] = useState(DEMO_JOB);
  const [resumeTexts, setResumeTexts] = useState(
    DEMO_RESUMES.map((r) => `--- ${r.name} ---\n${r.text}`).join("\n\n")
  );
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MatchResponse | null>(null);
  const [apiStatus, setApiStatus] = useState<string>("checking...");

  useEffect(() => {
    checkHealth()
      .then((h) => setApiStatus(`${h.status} · ${h.model}`))
      .catch(() => setApiStatus("offline"));
  }, []);

  const loadDemo = useCallback(() => {
    setMode("demo");
    setJobTitle("Senior Full Stack Engineer");
    setJobDescription(DEMO_JOB);
    setResumeTexts(DEMO_RESUMES.map((r) => `--- ${r.name} ---\n${r.text}`).join("\n\n"));
    setResults(null);
    setError(null);
  }, []);

  const parseResumeTexts = (raw: string) => {
    const chunks = raw.split(/---\s*/).filter(Boolean);
    return chunks.map((chunk) => {
      const lines = chunk.trim().split("\n");
      const nameLine = lines[0]?.trim() || "Candidate";
      const text = lines.slice(1).join("\n").trim() || chunk.trim();
      return { name: nameLine.replace(/---/g, "").trim(), text: text || chunk.trim() };
    });
  };

  const runMatch = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: MatchResponse;
      if (mode === "upload") {
        data = await matchFromUpload(jobTitle, jobDescription, jobFile, resumeFiles);
      } else {
        const resumes =
          mode === "demo"
            ? DEMO_RESUMES
            : parseResumeTexts(resumeTexts);
        data = await matchFromText(jobTitle, jobDescription, resumes);
      }
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
          <Sparkles className="h-4 w-4" />
          Microsoft Codeathon · Semantic AI Matching
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Hire<span className="text-indigo-600">Re</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
          Intelligent resume-to-job matching using embeddings, skill ontologies, and explainable scores —
          not just keyword search.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
            <Brain className="h-3.5 w-3.5" /> API: {apiStatus}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
            <Zap className="h-3.5 w-3.5" /> Synonym-aware matching
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
            <FileText className="h-3.5 w-3.5" /> PDF · DOCX · Text
          </span>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>Upload or paste a job + multiple resumes to rank candidates.</CardDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                {(["demo", "paste", "upload"] as Mode[]).map((m) => (
                  <Button
                    key={m}
                    size="sm"
                    variant={mode === m ? "default" : "outline"}
                    onClick={() => {
                      if (m === "demo") loadDemo();
                      else setMode(m);
                    }}
                  >
                    {m === "demo" ? "Demo Data" : m === "paste" ? "Paste Text" : "Upload Files"}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Job Title</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  disabled={mode === "demo"}
                />
              </div>

              {mode !== "upload" ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Job Description</label>
                    <textarea
                      className="h-40 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      disabled={mode === "demo"}
                    />
                  </div>
                  {mode === "paste" && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Resumes (separate with --- Name ---)
                      </label>
                      <textarea
                        className="h-48 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={resumeTexts}
                        onChange={(e) => setResumeTexts(e.target.value)}
                      />
                    </div>
                  )}
                  {mode === "demo" && (
                    <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
                      Pre-loaded with 1 job + 4 sample resumes. Click <strong>Run Matching</strong> for an instant demo.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Job File (optional if pasted below)</label>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.md"
                      className="w-full text-sm"
                      onChange={(e) => setJobFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Job Description (if no file)</label>
                    <textarea
                      className="h-32 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Resume Files (multiple)</label>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.md"
                      multiple
                      className="w-full text-sm"
                      onChange={(e) => setResumeFiles(Array.from(e.target.files || []))}
                    />
                    {resumeFiles.length > 0 && (
                      <p className="mt-1 text-xs text-slate-500">{resumeFiles.length} file(s) selected</p>
                    )}
                  </div>
                </>
              )}

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <Button className="w-full" size="lg" onClick={runMatch} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Analyzing with semantic engine...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Run Matching
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
            <CardContent className="p-5 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Why HireRe beats keyword matching</p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>Maps synonyms: Node.js ↔ JavaScript, K8s ↔ Kubernetes</li>
                <li>Embedding similarity for related skills (PyTorch → Machine Learning)</li>
                <li>Weighted score: skills (55%) + semantic fit (30%) + experience (15%)</li>
                <li>Human-readable explanations for every candidate</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div>
          {results ? (
            <ResultsPanel results={results} />
          ) : (
            <Card className="flex h-full min-h-[400px] items-center justify-center border-dashed">
              <CardContent className="text-center text-slate-400">
                <Brain className="mx-auto mb-3 h-12 w-12 opacity-40" />
                <p className="text-lg font-medium">Results will appear here</p>
                <p className="mt-1 text-sm">Run matching to see ranked candidates with scores & explanations</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
