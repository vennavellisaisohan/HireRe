"use client";

import { cn, scoreAccent, scoreLabel } from "@/lib/utils";
import type { CandidateMatchResult, MatchResponse } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, Mail } from "lucide-react";
import { useState } from "react";

function ScoreRing({ score }: { score: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const stroke =
    score >= 80 ? "#10b981" : score >= 60 ? "#2563eb" : score >= 40 ? "#d97706" : "#e11d48";

  return (
    <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center">
      <svg className="-rotate-90" width="72" height="72" aria-hidden>
        <circle cx="36" cy="36" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute text-center">
        <span className={cn("text-xl font-semibold tabular-nums", scoreAccent(score))}>
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
}

function CandidateCard({ candidate, rank }: { candidate: CandidateMatchResult; rank: number }) {
  const [expanded, setExpanded] = useState(rank === 1);

  return (
    <Card className={cn("transition-shadow hover:shadow-md", rank === 1 && "border-foreground/20")}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {rank}
              </span>
              <CardTitle className="truncate text-base">{candidate.candidate_name}</CardTitle>
              {rank === 1 && (
                <Badge variant="secondary" className="shrink-0">
                  Top match
                </Badge>
              )}
            </div>
            {candidate.candidate_email && (
              <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                {candidate.candidate_email}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {candidate.years_experience} yrs · {candidate.matched_skills.length} skills matched ·{" "}
              <span className={scoreAccent(candidate.overall_score)}>{scoreLabel(candidate.overall_score)}</span>
            </p>
          </div>
          <ScoreRing score={candidate.overall_score} />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Skills", value: candidate.breakdown.skill_score },
            { label: "Semantic", value: candidate.breakdown.semantic_score },
            { label: "Experience", value: candidate.breakdown.experience_score },
          ].map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium tabular-nums">{item.value.toFixed(0)}%</span>
              </div>
              <Progress value={item.value} />
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Matched</p>
          <div className="flex flex-wrap gap-1.5">
            {candidate.matched_skills.length > 0 ? (
              candidate.matched_skills.map((m) => (
                <Badge key={m.job_skill} variant="success" title={`${m.match_type} · ${(m.similarity * 100).toFixed(0)}%`}>
                  {m.job_skill}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">None detected</span>
            )}
          </div>
        </div>

        {candidate.missing_skills.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Missing</p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.missing_skills.map((s) => (
                <Badge key={s} variant="danger">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {candidate.extra_skills.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Bonus</p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.extra_skills.slice(0, 8).map((s) => (
                <Badge key={s} variant="muted">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide explanation" : "View explanation"}
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </Button>

        {expanded && (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {candidate.explanation}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ResultsPanel({ results }: { results: MatchResponse }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Results</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {results.candidates.length} candidates · {results.job_title}
        </p>
        {results.required_skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {results.required_skills.slice(0, 12).map((s) => (
              <Badge key={s} variant="outline">
                {s}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {results.candidates.map((c, i) => (
          <CandidateCard key={`${c.candidate_name}-${i}`} candidate={c} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
