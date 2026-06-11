import { describe, expect, it } from "vitest";
import { buildCommercialMessage } from "@/lib/generation/commercial-message-builder";
import { sellerSettingsSchema } from "@/lib/validation/freelance";

describe("seller settings generation integration", () => {
  it("uses saved seller settings in generated commercial text", () => {
    const settings = sellerSettingsSchema.parse({
      sellerName: "Guilherme",
      sellerWhatsapp: "+55 47 99999-0000",
      offerTitle: "landing page demo",
      preferredNicheIds: []
    });

    const message = buildCommercialMessage({
      lead: {
        businessName: "Studio Bela",
        city: "Indaial",
        leadScore: 70,
        category: "Beauty salon",
        classificationReasons: [],
        campaign: { nicheNameSnapshot: "Beauty salon" }
      } as never,
      template: {
        bodyTemplate: "{{seller_name}} offers {{offer_title}} for {{business_name}}"
      } as never,
      settings: settings as never
    });

    expect(message).toBe("Guilherme offers landing page demo for Studio Bela");
  });
});
