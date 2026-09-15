"use client";

import { cn, scoreColor } from "@/lib/utils";
import type { CandidateMatchResult } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, Mail, Trophy } from "lucide-react";
import { useState } from "react";

function ScoreRing({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "#10b981" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg className="-rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-slate-900">{Math.round(score)}</div>
        <div className="text-[10px] uppercase tracking-wide text-slate-500">/ 100</div>
      </div>
    </div>
  );
}

function CandidateCard({ candidate, rank }: { candidate: CandidateMatchResult; rank: number }) {
  const [expanded, setExpanded] = useState(rank === 1);

  return (
    <Card className={cn("overflow-hidden transition-shadow hover:shadow-md", rank === 1 && "ring-2 ring-indigo-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                rank === 1 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
              )}
            >
              {rank === 1 ? <Trophy className="h-4 w-4" /> : rank}
            </div>
            <div>
              <CardTitle className="text-base">{candidate.candidate_name}</CardTitle>
              {candidate.candidate_email && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <Mail className="h-3 w-3" />
                  {candidate.candidate_email}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                {candidate.years_experience} yrs experience · {candidate.matched_skills.length} skills matched
              </p>
            </div>
          </div>
          <ScoreRing score={candidate.overall_score} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Skills", value: candidate.breakdown.skill_score },
            { label: "Semantic", value: candidate.breakdown.semantic_score },
            { label: "Experience", value: candidate.breakdown.experience_score },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-slate-50 p-2">
              <div className="text-xs text-slate-500">{item.label}</div>
              <div className="text-sm font-semibold">{item.value.toFixed(0)}%</div>
              <Progress value={item.value} className="mt-1 h-1" />
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Matched Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {candidate.matched_skills.map((m) => (
              <Badge key={m.job_skill} variant="success" title={`${m.match_type} · ${(m.similarity * 100).toFixed(0)}%`}>
                {m.job_skill}
                {m.candidate_skill !== m.job_skill && m.candidate_skill && (
                  <span className="ml-1 opacity-70">← {m.candidate_skill}</span>
                )}
              </Badge>
            ))}
            {candidate.matched_skills.length === 0 && (
              <span className="text-sm text-slate-400">No strong skill matches</span>
            )}
          </div>
        </div>

        {candidate.missing_skills.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Missing Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.missing_skills.map((s) => (
                <Badge key={s} variant="danger">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {candidate.extra_skills.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Bonus Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.extra_skills.slice(0, 8).map((s) => (
                <Badge key={s} variant="outline">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          {expanded ? "Hide" : "Show"} explanation
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expanded && (
          <div className={cn("rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-line", scoreColor(candidate.overall_score))}>
            {candidate.explanation}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ResultsPanel({ results }: { results: import("@/lib/api").MatchResponse }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ranked Candidates</h2>
          <p className="text-sm text-slate-500">
            {results.candidates.length} candidates ranked for{" "}
            <span className="font-medium text-slate-700">{results.job_title}</span>
          </p>
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-medium uppercase text-slate-500">Required skills detected</p>
          <div className="mt-1 flex max-w-md flex-wrap justify-end gap-1">
            {results.required_skills.slice(0, 10).map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
        </div>
      </div>

      {results.candidates.map((c, i) => (
        <CandidateCard key={`${c.candidate_name}-${i}`} candidate={c} rank={i + 1} />
      ))}
    </div>
  );
}
