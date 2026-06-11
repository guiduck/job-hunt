import { describe, expect, it } from "vitest";
import { evaluateCandidate } from "@/worker/jobs/candidate-normalizer";
import { mockMapsProvider } from "@/lib/providers/mock-maps-provider";

describe("prospecting worker flow", () => {
  it("accepts deterministic mock candidates for processing", async () => {
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

    expect(candidates.map(evaluateCandidate).filter((item) => item.status === "accepted")).toHaveLength(3);
  });
});
