import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const openApi = readFileSync(
  resolve(process.cwd(), "../../specs/014-freelance-web-app/contracts/openapi.yaml"),
  "utf8"
);

describe("generation API contract", () => {
  it("documents on-demand prompt and message generation", () => {
    expect(openApi).toContain("/api/freelance/generation/lovable-prompt");
    expect(openApi).toContain("/api/freelance/generation/message");
    expect(openApi).toContain("variant");
    expect(openApi).toContain("templateId");
  });
});
