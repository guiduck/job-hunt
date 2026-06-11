import { getAppConfig } from "@/lib/config";
import {
  normalizeBusinessCandidate,
  type FreelanceMapsProvider,
  type FreelanceMapsSearchInput,
  type NormalizedBusinessCandidate
} from "./freelance-maps-provider";
import { buildGoogleMapsSearchUrl } from "@/lib/freelance/url-classification";

type SerpApiLocalResult = {
  title?: string;
  type?: string;
  address?: string;
  phone?: string;
  website?: string;
  gps_coordinates?: { latitude?: number; longitude?: number };
  place_id?: string;
  data_id?: string;
  rating?: number;
  reviews?: number;
  links?: { website?: string; directions?: string };
};

type SerpApiSearchResponse = {
  local_results?: SerpApiLocalResult[];
  serpapi_pagination?: { next?: string };
};

function buildSearchQuery(input: FreelanceMapsSearchInput) {
  return [input.queryTerms[0] ?? input.nicheName, input.city, input.region, input.country]
    .filter(Boolean)
    .join(" ");
}

function mapResult(
  input: FreelanceMapsSearchInput,
  result: SerpApiLocalResult
): NormalizedBusinessCandidate {
  const sourceQuery = buildSearchQuery(input);
  const mapsSearchUrl = buildGoogleMapsSearchUrl([
    result.title,
    result.address,
    input.city,
    input.region,
    input.country
  ]);
  return normalizeBusinessCandidate({
    providerName: "serpapi_google_maps",
    sourceQuery,
    sourceName: "SerpApi Google Maps",
    sourceUrl: result.links?.directions ?? mapsSearchUrl,
    sourceIdentifier: result.place_id ?? result.data_id,
    businessName: result.title ?? "Unknown business",
    category: result.type,
    address: result.address,
    country: input.country,
    region: input.region,
    city: input.city,
    phone: result.phone,
    websiteUrl: result.website ?? result.links?.website,
    rating: result.rating,
    reviewCount: result.reviews,
    rawEvidence: `${result.title ?? "Business"} from SerpApi result for "${sourceQuery}"`,
    rawProviderPayload: result as Record<string, unknown>
  });
}

export function createSerpApiGoogleMapsProvider(): FreelanceMapsProvider {
  return {
    name: "serpapi_google_maps",
    async search(input) {
      const config = getAppConfig();
      if (!config.serpapiApiKey) {
        throw new Error("SERPAPI_API_KEY is required for serpapi_google_maps.");
      }

      const results: SerpApiLocalResult[] = [];
      const seenKeys = new Set<string>();
      let start = 0;
      let hasNextPage = true;

      while (results.length < input.maxResults && hasNextPage) {
        const params = new URLSearchParams({
          engine: "google_maps",
          q: buildSearchQuery(input),
          hl: input.marketScope === "BR" ? "pt-br" : "en",
          api_key: config.serpapiApiKey
        });
        if (start > 0) {
          params.set("start", String(start));
        }

        let response: Response;
        try {
          response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
        } catch (error) {
          throw new Error(
            `SerpApi Google Maps request could not reach the provider: ${
              error instanceof Error ? error.message : "network failure"
            }.`
          );
        }

        if (!response.ok) {
          const body = await response.text().catch(() => "");
          throw new Error(
            `SerpApi Google Maps request failed with status ${response.status}${
              body ? `: ${body.slice(0, 240)}` : ""
            }`
          );
        }

        const body = (await response.json()) as SerpApiSearchResponse;
        const pageResults = body.local_results ?? [];
        for (const result of pageResults) {
          const key = result.place_id ?? result.data_id ?? `${result.title ?? ""}:${result.address ?? ""}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            results.push(result);
          }
          if (results.length >= input.maxResults) {
            break;
          }
        }

        hasNextPage = Boolean(body.serpapi_pagination?.next) && pageResults.length > 0;
        start += pageResults.length || 20;
      }

      return results.slice(0, input.maxResults).map((result) => mapResult(input, result));
    }
  };
}
