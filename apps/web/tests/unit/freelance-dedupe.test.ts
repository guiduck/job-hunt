import { describe, expect, it } from "vitest";
import { checkDuplicate } from "@/worker/jobs/dedupe";
import type { NormalizedBusinessCandidate } from "@/lib/providers/freelance-maps-provider";

const candidate: NormalizedBusinessCandidate = {
  providerName: "mock",
  sourceQuery: "barbearia Indaial",
  sourceName: "Mock Google Maps",
  sourceIdentifier: "place-1",
  businessName: "Barbearia Central",
  country: "Brasil",
  city: "Indaial",
  phone: "+554700000000",
  rawEvidence: "Mock evidence",
  rawProviderPayload: {}
};

describe("freelance dedupe", () => {
  it("detects repeated source identifiers", () => {
    const seen = new Set<string>();
    expect(checkDuplicate(candidate, seen).duplicate).toBe(false);
    expect(checkDuplicate(candidate, seen).duplicate).toBe(true);
  });
});
