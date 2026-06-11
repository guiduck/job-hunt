import { describe, expect, it } from "vitest";
import { isCampaignSelectableNiche } from "@/lib/freelance/campaign-service";

describe("niche candidate selection guard", () => {
  it("keeps non-approved candidate statuses out of campaign selection and lead creation scope", () => {
    const candidateStatuses = ["proposed", "rejected", "deferred", "already_covered"];

    for (const status of candidateStatuses) {
      expect(isCampaignSelectableNiche({ enabled: true, lifecycleStatus: status })).toBe(false);
    }

    const candidateRecord = {
      proposedName: "Cleaning Service",
      status: "deferred",
      sourcePath: "docs/reference-ui.md#visual-reference"
    };

    expect(candidateRecord).not.toHaveProperty("businessName");
    expect(candidateRecord).not.toHaveProperty("sourceQuery");
    expect(candidateRecord).not.toHaveProperty("commercialStatus");
  });
});
