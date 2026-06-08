import { getAppConfig } from "@/lib/config";
import { createApifyGoogleMapsProvider } from "./apify-google-maps-provider";
import type { FreelanceMapsProvider } from "./freelance-maps-provider";
import { mockMapsProvider } from "./mock-maps-provider";
import { createSerpApiGoogleMapsProvider } from "./serpapi-google-maps-provider";

export function createFreelanceMapsProvider(): FreelanceMapsProvider {
  const config = getAppConfig();

  if (config.freelanceMapsProvider === "apify_google_maps") {
    return createApifyGoogleMapsProvider();
  }

  if (config.freelanceMapsProvider === "serpapi_google_maps") {
    return createSerpApiGoogleMapsProvider();
  }

  return mockMapsProvider;
}
