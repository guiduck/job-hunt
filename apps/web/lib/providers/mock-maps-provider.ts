import {
  type FreelanceMapsProvider,
  normalizeBusinessCandidate
} from "./freelance-maps-provider";

export const mockMapsProvider: FreelanceMapsProvider = {
  name: "mock",
  async search(input) {
    const sourceQuery = [...input.queryTerms, input.city, input.region]
      .filter(Boolean)
      .join(" ");

    return [
      normalizeBusinessCandidate({
        providerName: "mock",
        sourceQuery,
        sourceName: "Mock Google Maps",
        sourceUrl: `https://maps.google.com/?q=${encodeURIComponent(sourceQuery)}`,
        sourceIdentifier: `${input.campaignId}-mock-1`,
        businessName: `${input.nicheName} Central`,
        category: input.nicheName,
        address: `Main Street, ${input.city}`,
        country: input.country,
        region: input.region,
        city: input.city,
        phone: "+5500000000000",
        websiteUrl: "https://example.com",
        rating: 4.6,
        reviewCount: 42,
        rawEvidence: "Mock result with website, phone, rating, address and source URL.",
        rawProviderPayload: { mock: true }
      }),
      normalizeBusinessCandidate({
        providerName: "mock",
        sourceQuery,
        sourceName: "Mock Google Maps",
        sourceUrl: `https://maps.google.com/?q=${encodeURIComponent(sourceQuery + " social")}`,
        sourceIdentifier: `${input.campaignId}-mock-2`,
        businessName: `${input.nicheName} Social`,
        category: input.nicheName,
        address: `Second Street, ${input.city}`,
        country: input.country,
        region: input.region,
        city: input.city,
        phone: "+5500000000001",
        websiteUrl: "https://instagram.com/example",
        rating: 4.2,
        reviewCount: 18,
        rawEvidence: "Mock result with social profile, phone, rating and address.",
        rawProviderPayload: { mock: true }
      }),
      normalizeBusinessCandidate({
        providerName: "mock",
        sourceQuery,
        sourceName: "Mock Google Maps",
        sourceUrl: `https://maps.google.com/?q=${encodeURIComponent(sourceQuery + " no site")}`,
        sourceIdentifier: `${input.campaignId}-mock-3`,
        businessName: `${input.nicheName} Sem Site`,
        category: input.nicheName,
        address: `Third Street, ${input.city}`,
        country: input.country,
        region: input.region,
        city: input.city,
        phone: "+5500000000002",
        rating: 3.9,
        reviewCount: 9,
        rawEvidence: "Mock result with phone and Maps evidence but no website.",
        rawProviderPayload: { mock: true }
      })
    ];
  }
};
