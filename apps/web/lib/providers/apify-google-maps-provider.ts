import type { FreelanceMapsProvider } from "./freelance-maps-provider";

export function createApifyGoogleMapsProvider(): FreelanceMapsProvider {
  return {
    name: "apify_google_maps",
    async search() {
      throw new Error("Apify Google Maps provider is not implemented yet.");
    }
  };
}
