import { describe, expect, it } from "vitest";
import { leadFiltersSchema } from "@/lib/validation/freelance";

describe("lead filters integration", () => {
  it("parses URL-style filters used by the Leads page", () => {
    const filters = leadFiltersSchema.parse({
      q: "studio",
      websiteStatus: "weak_site",
      commercialStatus: "new",
      temperature: "warm",
      minScore: "70"
    });

    expect(filters.minScore).toBe(70);
    expect(filters.websiteStatus).toBe("weak_site");
  });

  it("ignores empty select values when filtering by website status only", () => {
    const filters = leadFiltersSchema.parse({
      websiteStatus: "no_site",
      commercialStatus: "",
      temperature: "",
      minScore: ""
    });

    expect(filters.websiteStatus).toBe("no_site");
    expect(filters.commercialStatus).toBeUndefined();
    expect(filters.temperature).toBeUndefined();
    expect(filters.minScore).toBeUndefined();
  });
});
