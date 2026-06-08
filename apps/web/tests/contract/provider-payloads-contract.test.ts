import { describe, expect, it } from "vitest";
import { normalizeBusinessCandidate } from "@/lib/providers/freelance-maps-provider";

describe("provider payload normalization contract", () => {
  it("normalizes and validates a reviewable business candidate", () => {
    const candidate = normalizeBusinessCandidate({
      providerName: "mock",
      sourceQuery: "  imobiliaria Indaial SC ",
      sourceName: "Google Maps",
      sourceUrl: "https://maps.google.com/?q=imobiliaria",
      sourceIdentifier: "place-123",
      businessName: " Example Imobiliaria ",
      category: "Imobiliaria",
      address: "Rua Example, 123",
      country: "Brasil",
      region: "SC",
      city: " Indaial ",
      phone: "+5547999999999",
      websiteUrl: "https://example.com",
      rating: 4.8,
      reviewCount: 71,
      rawEvidence: "Result had website, phone, rating and address.",
      rawProviderPayload: {}
    });

    expect(candidate.businessName).toBe("Example Imobiliaria");
    expect(candidate.sourceQuery).toBe("imobiliaria Indaial SC");
    expect(candidate.city).toBe("Indaial");
  });

  it("rejects candidates without source evidence", () => {
    expect(() =>
      normalizeBusinessCandidate({
        providerName: "mock",
        sourceQuery: "dentist Alamo TX",
        sourceName: "Google Maps",
        businessName: "Alamo Dentist",
        country: "United States",
        city: "Alamo",
        rawEvidence: "",
        rawProviderPayload: {}
      })
    ).toThrow();
  });
});
