import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const openApi = readFileSync(
  resolve(process.cwd(), "../../specs/014-freelance-web-app/contracts/openapi.yaml"),
  "utf8"
);

describe("prospecting jobs contract", () => {
  it("documents prospecting job creation and read routes", () => {
    expect(openApi).toContain("/api/freelance/campaigns/{campaignId}/prospecting-jobs");
    expect(openApi).toContain("/api/freelance/prospecting-jobs:");
    expect(openApi).toContain("required: [campaignId]");
    expect(openApi).toContain("/api/freelance/prospecting-jobs/{jobId}");
  });
});
