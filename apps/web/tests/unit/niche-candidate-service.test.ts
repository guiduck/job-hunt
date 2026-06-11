import { describe, expect, it } from "vitest";
import {
  buildReferenceCandidateProposals,
  findApprovedNicheMatch
} from "@/lib/freelance/niche-candidate-service";
import { VISUAL_CANDIDATE_NICHES } from "@/lib/freelance/niche-reference-data";
import { catalogRowsFromBaseline } from "../fixtures/niche-catalog";

describe("niche candidate service", () => {
  it("builds deterministic niche-only proposals from visual references", () => {
    const proposals = buildReferenceCandidateProposals([]);

    expect(proposals).toHaveLength(VISUAL_CANDIDATE_NICHES.length);
    expect(proposals[0]).toMatchObject({
      proposedName: "Imobiliaria",
      normalizedName: "Imobiliaria",
      proposedSlug: "imobiliaria",
      sourcePath: "docs/reference-ui.md#visual-reference",
      status: "proposed"
    });
    expect(proposals[0]).not.toHaveProperty("businessName");
    expect(proposals[0]).not.toHaveProperty("phone");
    expect(proposals[0]).not.toHaveProperty("email");
  });

  it("matches reference candidates against approved baseline coverage", () => {
    const baselineRows = catalogRowsFromBaseline();
    const candidate = {
      proposedName: "Cleaning Service",
      proposedSlug: "cleaning-service",
      proposedQueryTerms: ["Residential cleaning"]
    };

    const match = findApprovedNicheMatch(candidate, baselineRows);

    expect(match?.displayName).toBe("Cleaning Service");
  });
});
