import { describe, expect, it } from "vitest";
import {
  nicheCandidateDecisionInputSchema,
  nicheCreateSchema,
  nicheUpdateSchema
} from "@/lib/validation/niche-catalog";

describe("niche catalog validation", () => {
  it("requires source evidence and query terms for enabled approved niches", () => {
    const result = nicheCreateSchema.safeParse({
      displayName: "Solar Installer",
      marketApplicability: "INTERNATIONAL",
      conversionHint: 12,
      conversionHintSource: "operator_override",
      aliases: [],
      queryTerms: [],
      sourcePath: "",
      sourceNote: "",
      enabled: true,
      sortOrder: 30
    });

    expect(result.success).toBe(false);
  });

  it("derives a normalized slug on create", () => {
    const result = nicheCreateSchema.parse({
      displayName: "ClÃ­nica de EstÃ©tica",
      marketApplicability: "BR",
      conversionHint: 18.5,
      conversionHintSource: "text_seed",
      aliases: [],
      queryTerms: ["Clinica de Estetica"],
      sourcePath: "docs/reference-ui.md",
      sourceNote: "Baseline reference",
      enabled: true,
      sortOrder: 1
    });

    expect(result.slug).toBe("clinica-de-estetica");
  });

  it("requires merge targets and candidate decision reasons", () => {
    expect(nicheUpdateSchema.safeParse({ lifecycleStatus: "merged" }).success).toBe(false);
    expect(nicheCandidateDecisionInputSchema.safeParse({ decision: "reject" }).success).toBe(false);
    expect(
      nicheCandidateDecisionInputSchema.safeParse({
        decision: "mark_already_covered",
        matchedNicheId: "niche-1"
      }).success
    ).toBe(true);
  });
});

