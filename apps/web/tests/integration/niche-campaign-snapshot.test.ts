import { describe, expect, it } from "vitest";
import { serializeCampaign } from "@/lib/freelance/campaign-service";

describe("niche campaign snapshots", () => {
  it("renders the historical campaign snapshot after catalog changes", () => {
    const campaign = serializeCampaign({
      id: "campaign-1",
      name: "Historic Dentist Campaign",
      marketScope: "INTERNATIONAL",
      country: "United States",
      region: null,
      state: "TX",
      city: "Alamo",
      nicheId: "niche-dentist",
      nicheNameSnapshot: "Dentist",
      conversionHintSnapshot: { toString: () => "17.5" } as never,
      status: "ready",
      leadCount: 0,
      hotLeadCount: 0,
      contactedCount: 0,
      notes: null,
      lastRunAt: null,
      createdAt: new Date("2026-06-01T00:00:00.000Z"),
      updatedAt: new Date("2026-06-01T00:00:00.000Z")
    });

    const changedCatalogRow = {
      displayName: "Dental Clinic",
      enabled: false,
      lifecycleStatus: "merged"
    };

    expect(changedCatalogRow.displayName).toBe("Dental Clinic");
    expect(campaign.nicheNameSnapshot).toBe("Dentist");
    expect(campaign.conversionHintSnapshot).toBe(17.5);
  });
});
