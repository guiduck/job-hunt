import { describe, expect, it } from "vitest";
import { forbiddenFreelanceCopyTerms } from "@/lib/freelance/constants";

const campaignScreenCopy = [
  "Campaigns",
  "Prospecting campaigns",
  "Create BR and international campaigns from the seeded niche catalog.",
  "Create campaign",
  "No campaigns yet",
  "Prospect",
  "View leads"
].join(" ");

describe("campaign copy guard", () => {
  it("does not leak Full-time job language into Campaigns", () => {
    const lowerCopy = campaignScreenCopy.toLowerCase();
    for (const forbidden of forbiddenFreelanceCopyTerms) {
      expect(lowerCopy).not.toContain(forbidden.toLowerCase());
    }
  });
});
