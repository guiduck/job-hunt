import { getAppConfig } from "@/lib/config";
import {
  normalizeBusinessCandidate,
  type FreelanceMapsProvider,
  type FreelanceMapsSearchInput,
  type NormalizedBusinessCandidate
} from "./freelance-maps-provider";

type ApifyPlace = {
  title?: string;
  type?: string;
  types?: string[];
  address?: string;
  phoneNumber?: string;
  website?: string;
  placeId?: string;
  cid?: string;
  rating?: number;
  ratingCount?: number;
  error_message?: string;
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
    sourceUrl: place.cid ? `https://www.google.com/maps?cid=${place.cid}` : undefined,
    sourceIdentifier: place.placeId ?? undefined,
    businessName: place.title ?? "Unknown business",
    category: place.type ?? place.types?.[0] ?? undefined,
    address: place.address ?? undefined,
    country: input.country,
    region: input.region,
    city: input.city,
    phone: place.phoneNumber ?? undefined,
    websiteUrl: place.website ?? undefined,
    rating: place.rating ?? undefined,
    reviewCount: place.ratingCount ?? undefined,
    rawEvidence: `${place.title ?? "Business"} from Apify result for "${sourceQuery}"`,
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
          `https://api.apify.com/v2/acts/johnvc~google-maps-places-api/run-sync-get-dataset-items?token=${config.apifyToken}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              searchTerms: [buildSearchQuery(input)],
              maxResultsPerSearch: Math.max(input.maxResults, 20),
              language: input.marketScope === "BR" ? "pt-BR" : "en"
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
      const places = items.filter((item) => !item.error_message);
      const errorRow = items.find((item) => item.error_message);
      if (places.length === 0 && errorRow) {
        throw new Error(`Apify Google Maps run returned an error: ${errorRow.error_message}`);
      }
      return places.slice(0, input.maxResults).map((place) => mapPlace(input, place));
    }
  };
}
