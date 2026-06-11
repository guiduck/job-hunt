import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("server secret guard", () => {
  it("keeps provider and AI secret access out of client components", () => {
    const clientFiles = [
      "components/campaigns/prospect-button.tsx",
      "components/leads/lovable-prompt-modal.tsx",
      "components/leads/message-generator-panel.tsx",
      "components/settings/seller-settings-form.tsx"
    ];

    for (const file of clientFiles) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source).not.toContain("process.env");
      expect(source).not.toContain("OPENAI_API_KEY");
      expect(source).not.toContain("APIFY_TOKEN");
      expect(source).not.toContain("SERPAPI_API_KEY");
    }
  });
});
