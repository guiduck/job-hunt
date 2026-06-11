import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const openApi = readFileSync(
  resolve(process.cwd(), "../../specs/014-freelance-web-app/contracts/openapi.yaml"),
  "utf8"
);

describe("lead API contract", () => {
  it("documents list, read, and update routes", () => {
    expect(openApi).toContain("/api/freelance/leads:");
    expect(openApi).toContain("/api/freelance/leads/{leadId}:");
    expect(openApi).toContain("summary: List Freelance leads with filters");
  });

  it("documents core lead filters", () => {
    expect(openApi).toContain("websiteStatus");
    expect(openApi).toContain("commercialStatus");
    expect(openApi).toContain("minScore");
  });
});
