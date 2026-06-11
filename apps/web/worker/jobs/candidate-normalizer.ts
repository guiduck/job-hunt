import type { NormalizedBusinessCandidate } from "@/lib/providers/freelance-maps-provider";

export type CandidateOutcome =
  | { status: "accepted"; candidate: NormalizedBusinessCandidate }
  | { status: "rejected_missing_identity" | "rejected_missing_evidence" | "rejected_no_reviewable_signal"; reason: string };

export function evaluateCandidate(candidate: NormalizedBusinessCandidate): CandidateOutcome {
  if (!candidate.businessName.trim()) {
    return { status: "rejected_missing_identity", reason: "Missing business name." };
  }

  if (!candidate.sourceUrl && !candidate.sourceIdentifier && !candidate.rawEvidence) {
    return { status: "rejected_missing_evidence", reason: "Missing source evidence." };
  }

  if (!candidate.phone && !candidate.websiteUrl && !candidate.sourceUrl) {
    return {
      status: "rejected_no_reviewable_signal",
      reason: "Missing phone, website, or reviewable source URL."
    };
  }

  return { status: "accepted", candidate };
}
