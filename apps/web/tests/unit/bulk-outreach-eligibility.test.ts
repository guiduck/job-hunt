import { describe, expect, it } from "vitest";
import { bulkOutreachLeadFixture } from "../fixtures/bulk-outreach";

describe("bulk outreach eligibility guards", () => {
  it("uses real saved Freelance lead fixtures rather than niche candidates", () => {
    const lead = bulkOutreachLeadFixture();

    expect(lead.id).toContain("lead_");
    expect(lead).toHaveProperty("businessName");
    expect(lead).not.toHaveProperty("proposedName");
    expect(lead.sourceEvidence).toContain("Google Maps");
  });
});
