import { describe, expect, it } from "vitest";
import { nicheCandidateDecisionInputSchema } from "@/lib/validation/niche-catalog";

describe("niche candidate decisions", () => {
  it("requires a matched niche when marking a candidate already covered", () => {
    expect(() =>
      nicheCandidateDecisionInputSchema.parse({ decision: "mark_already_covered" })
    ).toThrow();

    expect(
      nicheCandidateDecisionInputSchema.parse({
        decision: "mark_already_covered",
        matchedNicheId: "niche-1"
      })
    ).toMatchObject({ matchedNicheId: "niche-1" });
  });

  it("requires a reason for rejected and deferred decisions", () => {
    expect(() => nicheCandidateDecisionInputSchema.parse({ decision: "reject" })).toThrow();
    expect(() => nicheCandidateDecisionInputSchema.parse({ decision: "defer" })).toThrow();

    expect(
      nicheCandidateDecisionInputSchema.parse({
        decision: "defer",
        decisionReason: "Needs better evidence"
      })
    ).toMatchObject({ decisionReason: "Needs better evidence" });
  });
});
