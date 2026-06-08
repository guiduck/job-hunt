import type { FreelanceMapsProvider } from "./freelance-maps-provider";

export function createSerpApiGoogleMapsProvider(): FreelanceMapsProvider {
  return {
    name: "serpapi_google_maps",
    async search() {
      throw new Error("SerpApi Google Maps provider is not implemented yet.");
    }
  };
}
