import { getAppConfig } from "@/lib/config";
import { createApifyGoogleMapsProvider } from "./apify-google-maps-provider";
import type { FreelanceMapsProvider } from "./freelance-maps-provider";
import { mockMapsProvider } from "./mock-maps-provider";
import { createSerpApiGoogleMapsProvider } from "./serpapi-google-maps-provider";

export const prospectingProviderNames = [
  "serpapi_google_maps",
  "apify_google_maps",
  "mock"
] as const;

export type ProspectingProviderName = (typeof prospectingProviderNames)[number];

export function isProspectingProviderName(value: string): value is ProspectingProviderName {
  return prospectingProviderNames.includes(value as ProspectingProviderName);
}

export function assertProspectingProviderConfigured(providerName: ProspectingProviderName) {
  const config = getAppConfig();

  if (providerName === "serpapi_google_maps" && !config.serpapiApiKey) {
    throw new Error("SERPAPI_API_KEY is required to prospect with SerpApi Google Maps.");
  }

  if (providerName === "apify_google_maps" && !config.apifyToken) {
    throw new Error("APIFY_TOKEN is required to prospect with Apify Google Maps.");
  }
}

export function createFreelanceMapsProvider(
  providerName: ProspectingProviderName
): FreelanceMapsProvider {
  assertProspectingProviderConfigured(providerName);

  if (providerName === "apify_google_maps") {
    return createApifyGoogleMapsProvider();
  }

  if (providerName === "serpapi_google_maps") {
    return createSerpApiGoogleMapsProvider();
  }

  return mockMapsProvider;
}
