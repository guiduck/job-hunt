import { describe, expect, it } from "vitest";
import { evaluateCandidate } from "@/worker/jobs/candidate-normalizer";

describe("prospecting failure states", () => {
  it("rejects candidates without reviewable identity", () => {
    expect(
      evaluateCandidate({
        providerName: "mock",
        sourceQuery: "query",
        sourceName: "Mock",
        businessName: "",
        country: "Brasil",
        city: "Indaial",
        rawEvidence: "evidence",
        rawProviderPayload: {}
      }).status
    ).toBe("rejected_missing_identity");
  });
});
