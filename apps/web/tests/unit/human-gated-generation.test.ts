import { describe, expect, it } from "vitest";
import { buildBulkCommercialDraft } from "@/lib/generation/commercial-message-builder";

describe("human-gated bulk generation", () => {
  it("returns draft content without delivery-provider fields", () => {
    const draft = buildBulkCommercialDraft({
      channel: "email",
      lead: {
        id: "lead_1",
        businessName: "Example Business",
        category: "Restaurant",
        city: "Miami",
        demoUrl: null,
        leadScore: 70,
        classificationReasons: [],
        campaign: { nicheNameSnapshot: "Restaurant" }
      } as never,
      template: {
        id: "template_1",
        bodyTemplate: "Hi {{business_name}}, I can help with {{offer_title}}."
      } as never,
      settings: null
    });

    expect(draft).toHaveProperty("body");
    expect(draft).not.toHaveProperty("providerName");
    expect(draft).not.toHaveProperty("providerMessageId");
    expect(draft).not.toHaveProperty("deliveryRequestId");
  });
});
