import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const openApi = readFileSync(
  resolve(process.cwd(), "../../specs/014-freelance-web-app/contracts/openapi.yaml"),
  "utf8"
);

describe("settings API contract", () => {
  it("documents seller settings read and save routes", () => {
    expect(openApi).toContain("/api/freelance/settings");
    expect(openApi).toContain("summary: Read seller settings");
    expect(openApi).toContain("summary: Upsert seller settings");
  });
});
