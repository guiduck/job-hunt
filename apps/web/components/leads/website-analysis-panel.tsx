import type { WebsiteAnalysis } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function jsonArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function hasRealAuditScores(analysis: WebsiteAnalysis): boolean {
  const evidence = jsonArray(analysis.evidencePoints);
  if (evidence.some((point) => point.toLowerCase().includes("mock analysis"))) {
    return false;
  }
  if (analysis.httpStatus == null) {
    return false;
  }
  if (
    analysis.contentScore == null ||
    analysis.designScore == null ||
    analysis.performanceScore == null ||
    analysis.seoScore == null
  ) {
    return false;
  }
  return !["no_site", "social_only", "linktree", "aggregator"].includes(analysis.detectedStatus);
}

function displayEvidence(analysis: WebsiteAnalysis, showScores: boolean): string[] {
  const evidence = jsonArray(analysis.evidencePoints);
  if (showScores) {
    return evidence;
  }
  return evidence.filter((point) => {
    const normalized = point.toLowerCase();
    return !normalized.startsWith("opportunity score:") && !normalized.includes("mock analysis");
  });
}

export function WebsiteAnalysisPanel({
  analysis,
  score
}: {
  analysis?: WebsiteAnalysis;
  score: number;
}) {
  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Website analysis</CardTitle>
        </CardHeader>
        <CardContent>No analysis snapshot yet.</CardContent>
      </Card>
    );
  }
  const showScores = hasRealAuditScores(analysis);
  const evidencePoints = displayEvidence(analysis, showScores);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Website analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showScores ? (
          <div className="grid gap-3 sm:grid-cols-5">
            {[
              ["Overall", score],
              ["Content", analysis.contentScore],
              ["Design", analysis.designScore],
              ["Performance", analysis.performanceScore],
              ["SEO", analysis.seoScore]
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-slate-800 p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-semibold text-slate-100">{value ?? 0}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-slate-800 p-3 text-sm text-slate-300">
            No real website audit has been run for this lead yet.
          </div>
        )}
        <ul className="list-disc space-y-1 pl-5">
          {evidencePoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
