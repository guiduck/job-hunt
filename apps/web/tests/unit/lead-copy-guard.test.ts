import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { forbiddenFreelanceCopyTerms } from "@/lib/freelance/constants";

describe("lead copy guard", () => {
  it("keeps lead screens free of job-flow terms", () => {
    const copy = [
      readFileSync(resolve(process.cwd(), "app/(freelance)/leads/page.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/(freelance)/leads/[leadId]/page.tsx"), "utf8")
    ]
      .join("\n")
      .toLowerCase();

    for (const forbidden of forbiddenFreelanceCopyTerms) {
      expect(copy).not.toContain(forbidden.toLowerCase());
    }
  });
});
