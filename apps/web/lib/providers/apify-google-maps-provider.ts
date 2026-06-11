import { getAppConfig } from "@/lib/config";
import {
  normalizeBusinessCandidate,
  type FreelanceMapsProvider,
  type FreelanceMapsSearchInput,
  type NormalizedBusinessCandidate
} from "./freelance-maps-provider";

type ApifyPlace = {
  title?: string;
  name?: string;
  categoryName?: string;
  address?: string;
  phone?: string;
  website?: string;
  url?: string;
  placeId?: string;
  totalScore?: number;
  reviewsCount?: number;
};

function buildSearchQuery(input: FreelanceMapsSearchInput) {
  return [input.queryTerms[0] ?? input.nicheName, input.city, input.region, input.country]
    .filter(Boolean)
    .join(" ");
}

function mapPlace(input: FreelanceMapsSearchInput, place: ApifyPlace): NormalizedBusinessCandidate {
  const sourceQuery = buildSearchQuery(input);
  return normalizeBusinessCandidate({
    providerName: "apify_google_maps",
    sourceQuery,
    sourceName: "Apify Google Maps Scraper",
    sourceUrl: place.url,
    sourceIdentifier: place.placeId,
    businessName: place.title ?? place.name ?? "Unknown business",
    category: place.categoryName,
    address: place.address,
    country: input.country,
    region: input.region,
    city: input.city,
    phone: place.phone,
    websiteUrl: place.website,
    rating: place.totalScore,
    reviewCount: place.reviewsCount,
    rawEvidence: `${place.title ?? place.name ?? "Business"} from Apify result for "${sourceQuery}"`,
    rawProviderPayload: place as Record<string, unknown>
  });
}

export function createApifyGoogleMapsProvider(): FreelanceMapsProvider {
  return {
    name: "apify_google_maps",
    async search(input) {
      const config = getAppConfig();
      if (!config.apifyToken) {
        throw new Error("APIFY_TOKEN is required for apify_google_maps.");
      }

      let response: Response;
      try {
        response = await fetch(
          `https://api.apify.com/v2/acts/compass~google-maps-scraper/run-sync-get-dataset-items?token=${config.apifyToken}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              searchStringsArray: [buildSearchQuery(input)],
              maxCrawledPlacesPerSearch: input.maxResults,
              language: input.marketScope === "BR" ? "pt-BR" : "en",
              scrapePlaceDetailPage: true
            })
          }
        );
      } catch (error) {
        throw new Error(
          `Apify Google Maps request could not reach the provider: ${
            error instanceof Error ? error.message : "network failure"
          }.`
        );
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `Apify Google Maps request failed with status ${response.status}${
            body ? `: ${body.slice(0, 240)}` : ""
          }`
        );
      }

      const items = (await response.json()) as ApifyPlace[];
      return items.slice(0, input.maxResults).map((place) => mapPlace(input, place));
    }
  };
}
