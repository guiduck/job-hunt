import { describe, expect, it } from "vitest";
import {
  forbiddenFreelanceCopyTerms,
  freelanceNavigationItems
} from "@/lib/freelance/constants";

describe("Freelance copy guard", () => {
  it("keeps navigation focused on Freelance operations", () => {
    const navigationCopy = freelanceNavigationItems.map((item) => item.label).join(" ").toLowerCase();

    for (const forbidden of forbiddenFreelanceCopyTerms) {
      expect(navigationCopy).not.toContain(forbidden.toLowerCase());
    }
  });
});
