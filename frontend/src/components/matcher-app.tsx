"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { checkHealth, matchFromText, matchFromUpload, type MatchResponse } from "@/lib/api";
import { DEMO_JOB, DEMO_RESUMES } from "@/lib/demo-data";
import { ResultsPanel } from "@/components/results-panel";
import { ArrowRight, Loader2, Sparkles, Upload } from "lucide-react";

type Mode = "demo" | "paste" | "upload";

const MODES: { value: Mode; label: string }[] = [
  { value: "demo", label: "Demo" },
  { value: "paste", label: "Paste" },
  { value: "upload", label: "Upload" },
];

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
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

  const loadDemo = useCallback(() => {
    setMode("demo");
    setJobTitle("Senior Full Stack Engineer");
    setJobDescription(DEMO_JOB);
    setResumeTexts(DEMO_RESUMES.map((r) => `--- ${r.name} ---\n${r.text}`).join("\n\n"));
    setResults(null);
    setError(null);
  }, []);

  const handleModeChange = (next: Mode) => {
    if (next === "demo") loadDemo();
    else setMode(next);
  };

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
        const resumes = mode === "demo" ? DEMO_RESUMES : parseResumeTexts(resumeTexts);
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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      {/* Nav */}
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">HireRe</h1>
            <p className="text-xs text-muted-foreground">Semantic resume matching</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`h-2 w-2 rounded-full ${
              apiOnline === null ? "bg-amber-400" : apiOnline ? "bg-emerald-500" : "bg-red-500"
            }`}
          />
          {apiOnline === null ? "Connecting" : apiOnline ? "API online" : "API offline"}
        </div>
      </header>

      {/* Hero */}
      <section className="mb-10 max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Rank candidates with semantic intelligence
        </h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Match resumes to job descriptions using skill ontologies and embedding similarity —
          beyond simple keyword search.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        {/* Input panel */}
        <Card className="h-fit">
          <CardHeader className="space-y-4">
            <div>
              <CardTitle className="text-base">New analysis</CardTitle>
              <CardDescription>Add a job and resumes to generate ranked matches.</CardDescription>
            </div>
            <Tabs options={MODES} value={mode} onChange={handleModeChange} />
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="job-title">Job title</Label>
              <Input
                id="job-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={mode === "demo"}
                placeholder="e.g. Senior Full Stack Engineer"
              />
            </div>

            {mode !== "upload" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="job-desc">Job description</Label>
                  <Textarea
                    id="job-desc"
                    className="min-h-[140px] font-mono text-xs"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    disabled={mode === "demo"}
                  />
                </div>

                {mode === "paste" && (
                  <div className="space-y-2">
                    <Label htmlFor="resumes">Resumes</Label>
                    <Textarea
                      id="resumes"
                      className="min-h-[160px] font-mono text-xs"
                      value={resumeTexts}
                      onChange={(e) => setResumeTexts(e.target.value)}
                      placeholder="Separate each resume with --- Name ---"
                    />
                  </div>
                )}

                {mode === "demo" && (
                  <Alert variant="muted">
                    Pre-loaded with 1 job and 4 sample resumes. Hit analyze for an instant demo.
                  </Alert>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="job-file">Job file</Label>
                  <Input
                    id="job-file"
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    className="cursor-pointer file:mr-3 file:text-sm file:font-medium"
                    onChange={(e) => setJobFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-desc-upload">Or paste job description</Label>
                  <Textarea
                    id="job-desc-upload"
                    className="min-h-[100px] text-sm"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resume-files">Resume files</Label>
                  <Input
                    id="resume-files"
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    multiple
                    className="cursor-pointer file:mr-3 file:text-sm file:font-medium"
                    onChange={(e) => setResumeFiles(Array.from(e.target.files || []))}
                  />
                  {resumeFiles.length > 0 && (
                    <p className="text-xs text-muted-foreground">{resumeFiles.length} file(s) selected</p>
                  )}
                </div>
              </>
            )}

            {error && <Alert variant="destructive">{error}</Alert>}

            <Separator />

            <Button className="w-full" size="lg" onClick={runMatch} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  Analyze candidates
                  <ArrowRight />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results panel */}
        <div className="min-h-[480px]">
          {results ? (
            <ResultsPanel results={results} />
          ) : (
            <Card className="flex h-full min-h-[480px] flex-col items-center justify-center border-dashed bg-muted/20 shadow-none">
              <CardContent className="flex flex-col items-center px-6 py-16 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="font-medium">No results yet</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Run an analysis to see ranked candidates, skill gaps, and score explanations.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer stats */}
      <footer className="mt-16 grid gap-4 border-t pt-8 sm:grid-cols-3">
        {[
          { label: "Skill matching", desc: "Synonym-aware ontology + semantic similarity" },
          { label: "Scoring", desc: "Skills 55% · Semantic 30% · Experience 15%" },
          { label: "Formats", desc: "PDF, DOCX, and plain text supported" },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-sm font-medium">{item.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </footer>
    </div>
  );
}
