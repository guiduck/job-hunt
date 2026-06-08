import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const openApi = readFileSync(
  resolve(process.cwd(), "../../specs/014-freelance-web-app/contracts/openapi.yaml"),
  "utf8"
);

describe("campaign API contract", () => {
  it("documents niche and campaign routes", () => {
    expect(openApi).toContain("/api/freelance/niches");
    expect(openApi).toContain("/api/freelance/campaigns");
    expect(openApi).toContain("/api/freelance/campaigns/{campaignId}");
  });

  it("requires market, country, city and niche to create a campaign", () => {
    expect(openApi).toContain("required: [marketScope, country, city, nicheId]");
  });
});
