import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const bulkUiFiles = [
  "components/leads/bulk-outreach-panel.tsx",
  "components/leads/bulk-outreach-review.tsx",
  "components/leads/bulk-outreach-item-editor.tsx",
  "components/leads/bulk-outreach-counters.tsx",
  "components/settings/channel-settings-panel.tsx",
  "components/settings/seller-settings-form.tsx"
];

describe("Freelance bulk outreach copy guard", () => {
  it("keeps bulk outreach UI in Freelance vocabulary", () => {
    const blockedTerms = ["job", "resume", "candidature", "recruiter", "interview"];

    for (const file of bulkUiFiles) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8").toLowerCase();
      for (const term of blockedTerms) {
        expect(source, `${file} should not contain ${term}`).not.toContain(term);
      }
    }
  });
});
