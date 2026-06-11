import { describe, expect, it } from "vitest";
import { isCampaignSelectableNiche } from "@/lib/freelance/campaign-service";

describe("niche campaign selection", () => {
  it("excludes disabled, merged, and unapproved niches from new campaign selection", () => {
    expect(isCampaignSelectableNiche({ enabled: true, lifecycleStatus: "approved" })).toBe(true);
    expect(isCampaignSelectableNiche({ enabled: false, lifecycleStatus: "disabled" })).toBe(false);
    expect(isCampaignSelectableNiche({ enabled: false, lifecycleStatus: "merged" })).toBe(false);
    expect(isCampaignSelectableNiche({ enabled: true, lifecycleStatus: "merged" })).toBe(false);
  });
});
