import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const openApi = readFileSync(
  resolve(process.cwd(), "../../specs/014-freelance-web-app/contracts/openapi.yaml"),
  "utf8"
);

describe("template API contract", () => {
  it("documents commercial template management", () => {
    expect(openApi).toContain("/api/freelance/templates");
    expect(openApi).toContain("summary: List commercial templates");
    expect(openApi).toContain("bodyTemplate");
  });
});
