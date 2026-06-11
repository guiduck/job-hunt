import { describe, expect, it } from "vitest";
import { classifyWebsite } from "@/worker/website-analysis/classifier";

describe("website status mapping", () => {
  it("classifies missing, social and weak websites", () => {
    expect(classifyWebsite({ businessName: "A", city: "X", nicheName: "N" })).toBe("no_site");
    expect(
      classifyWebsite({
        businessName: "A",
        city: "X",
        nicheName: "N",
        websiteUrl: "https://instagram.com/example"
      })
    ).toBe("social_only");
    expect(
      classifyWebsite({
        businessName: "A",
        city: "X",
        nicheName: "N",
        websiteUrl: "https://example.com"
      })
    ).toBe("weak_site");
  });
});
