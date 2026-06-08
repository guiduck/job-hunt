import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const openApi = readFileSync(
  resolve(process.cwd(), "../../specs/014-freelance-web-app/contracts/openapi.yaml"),
  "utf8"
);

describe("Freelance OpenAPI contract", () => {
  it("documents the foundational Freelance API routes", () => {
    for (const route of [
      "/api/freelance/niches",
      "/api/freelance/campaigns",
      "/api/freelance/leads",
      "/api/freelance/templates",
      "/api/freelance/settings",
      "/api/freelance/generation/lovable-prompt",
      "/api/freelance/generation/message"
    ]) {
      expect(openApi).toContain(route);
    }
  });

  it("keeps generation contracts human gated", () => {
    expect(openApi).toContain("Generate Lovable prompt on demand");
    expect(openApi).not.toMatch(/sendEmail|sendWhatsapp|bulkSend/i);
  });
});
