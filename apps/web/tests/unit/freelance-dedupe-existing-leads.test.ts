import { describe, expect, it } from "vitest";
import { candidateDedupeKey, existingLeadDedupeKeys } from "@/worker/jobs/dedupe";
import type { NormalizedBusinessCandidate } from "@/lib/providers/freelance-maps-provider";

describe("freelance dedupe against existing leads", () => {
  it("uses compatible keys for provider candidates and already saved leads", () => {
    const candidate: NormalizedBusinessCandidate = {
      providerName: "serpapi_google_maps",
      sourceName: "SerpApi Google Maps",
      sourceQuery: "Igrejas Brasilia DF Brasil",
      sourceIdentifier: "place_123",
      businessName: "Paroquia Bom Jesus",
      address: "Av L2 Sul, Brasilia - DF",
      country: "Brasil",
      region: "DF",
      city: "Brasilia",
      phone: "+55 61 3226-5553",
      websiteUrl: "https://www.instagram.com/paroquiabomjesusbsb/",
      rawEvidence: "Provider result",
      rawProviderPayload: {}
    };

    const existingLeadKeys = existingLeadDedupeKeys({
      businessName: "Paroquia Bom Jesus",
      address: "Av L2 Sul, Brasilia - DF",
      city: "Brasilia",
      phone: "+55 61 3226-5553",
      socialUrl: "https://www.instagram.com/paroquiabomjesusbsb/",
      sourceIdentifier: "place_123"
    });

    expect(existingLeadKeys).toContain(candidateDedupeKey(candidate));
  });
});
