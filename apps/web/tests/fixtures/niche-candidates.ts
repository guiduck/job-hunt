import { VISUAL_CANDIDATE_NICHES } from "@/lib/freelance/niche-reference-data";
import type { AuditableCandidateRow } from "@/lib/freelance/niche-audit-types";

export const visualCandidateFixtures: AuditableCandidateRow[] = VISUAL_CANDIDATE_NICHES.map(
  (candidate, index) => ({
    id: `candidate-${index + 1}`,
    proposedName: candidate.proposedName,
    proposedSlug: candidate.proposedSlug,
    status: "proposed"
  })
);

