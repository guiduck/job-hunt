"use client";

import type { NicheDto } from "@/lib/freelance/campaign-service";
import type { NicheCandidateDto } from "@/lib/freelance/niche-candidate-service";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { NicheCandidateDecisionDialog } from "./niche-candidate-decision-dialog";

function statusTone(status: string) {
  if (status === "approved" || status === "already_covered") {
    return "success" as const;
  }
  if (status === "rejected") {
    return "danger" as const;
  }
  return "neutral" as const;
}

export function NicheCandidateList({
  candidates,
  niches
}: {
  candidates: NicheCandidateDto[];
  niches: NicheDto[];
}) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-md border border-slate-800 p-4 text-sm text-slate-400">
        No reference-derived niche candidates need review.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-slate-800">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Candidate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Evidence</TableHead>
            <TableHead>Suggested match</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow key={candidate.id}>
              <TableCell>
                <p className="font-medium">{candidate.proposedName}</p>
                <p className="text-xs text-slate-500">{candidate.proposedSlug}</p>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                  {candidate.proposedQueryTerms.join(", ")}
                </p>
              </TableCell>
              <TableCell>
                <Badge tone={statusTone(candidate.status)}>{candidate.status}</Badge>
              </TableCell>
              <TableCell>
                <p className="max-w-sm truncate text-xs text-slate-400">{candidate.sourcePath}</p>
                {candidate.sourceNote ? (
                  <p className="mt-1 max-w-sm text-xs text-slate-500">{candidate.sourceNote}</p>
                ) : null}
              </TableCell>
              <TableCell>
                <p className="text-xs text-slate-300">
                  {candidate.matchedNicheName
                    ? `Suggested match: ${candidate.matchedNicheName}`
                    : "No approved match"}
                </p>
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <NicheCandidateDecisionDialog candidate={candidate} niches={niches} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
