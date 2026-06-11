import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("human-gated generation", () => {
  it("does not expose automatic send actions in lead generation components", () => {
    const messagePanel = readFileSync(
      resolve(process.cwd(), "components/leads/message-generator-panel.tsx"),
      "utf8"
    ).toLowerCase();

    expect(messagePanel).not.toContain("sendemail");
    expect(messagePanel).not.toContain("sendwhatsapp");
    expect(messagePanel).not.toContain("automatic outreach");
  });
});
