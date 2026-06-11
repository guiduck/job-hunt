import { afterEach, describe, expect, it, vi } from "vitest";
import { mockMapsProvider } from "@/lib/providers/mock-maps-provider";
import { createSerpApiGoogleMapsProvider } from "@/lib/providers/serpapi-google-maps-provider";

describe("maps provider normalization", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns deterministic mock candidates", async () => {
    const candidates = await mockMapsProvider.search({
      jobId: "job_1",
      campaignId: "campaign_1",
      marketScope: "BR",
      country: "Brasil",
      region: "SC",
      city: "Indaial",
      nicheName: "Barbearia",
      queryTerms: ["Barbearia"],
      maxResults: 25
    });

    expect(candidates).toHaveLength(3);
    expect(candidates[0]?.sourceQuery).toContain("Barbearia");
    expect(candidates[0]?.rawEvidence).toContain("Mock result");
  });

  it("paginates SerpApi Google Maps results up to the requested max", async () => {
    vi.stubEnv("SERPAPI_API_KEY", "test_key");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          local_results: Array.from({ length: 20 }, (_, index) => ({
            title: `Business ${index + 1}`,
            address: `${index + 1} Main St`,
            place_id: `place_${index + 1}`
          })),
          serpapi_pagination: { next: "https://serpapi.com/search.json?start=20" }
        })
      )
      .mockResolvedValueOnce(
        Response.json({
          local_results: Array.from({ length: 20 }, (_, index) => ({
            title: `Business ${index + 21}`,
            address: `${index + 21} Main St`,
            place_id: `place_${index + 21}`
          }))
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const candidates = await createSerpApiGoogleMapsProvider().search({
      jobId: "job_1",
      campaignId: "campaign_1",
      marketScope: "BR",
      country: "Brasil",
      region: "DF",
      city: "Brasilia",
      nicheName: "Igrejas",
      queryTerms: ["Igrejas"],
      maxResults: 35
    });

    expect(candidates).toHaveLength(35);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("start=20");
  });
});
