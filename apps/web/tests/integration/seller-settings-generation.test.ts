import { describe, expect, it } from "vitest";
import { buildCommercialMessage } from "@/lib/generation/commercial-message-builder";
import { sellerSettingsSchema } from "@/lib/validation/freelance";

describe("seller settings generation integration", () => {
  it("uses saved seller settings in generated commercial text", () => {
    const settings = sellerSettingsSchema.parse({
      sellerName: "Guilherme",
      sellerWhatsapp: "+55 47 99999-0000",
      companyWebsite: "https://gfig.space",
      portfolioUrl: "https://portfolio.gfig.space",
      sellerLinkedinUrl: "https://www.linkedin.com/in/guilherme",
      landingPagePrice: 2500,
      landingPagePriceUsd: 1000,
      advancedPriceRangeBrl: "3000-5000",
      advancedPriceRangeUsd: "1200-2000",
      automationPriceRangeBrl: "from 6000",
      automationPriceRangeUsd: "from 2500",
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
        bodyTemplate: "{{seller_name}} offers {{offer_title}} for {{business_name}} via {{company_website}} {{portfolio_url}} {{seller_linkedin_url}} {{seller_whatsapp}} {{base_price_brl}} {{base_price_usd}} {{advanced_price_range_brl}} {{advanced_price_range_usd}} {{automation_price_range_brl}} {{automation_price_range_usd}}"
      } as never,
      settings: settings as never
    });

    expect(message).toContain("Guilherme offers landing page demo for Studio Bela");
    expect(message).toContain("https://gfig.space");
    expect(message).toContain("https://portfolio.gfig.space");
    expect(message).toContain("https://www.linkedin.com/in/guilherme");
    expect(message).toContain("+55 47 99999-0000");
    expect(message).toContain("2500");
    expect(message).toContain("1000");
    expect(message).toContain("3000-5000");
    expect(message).toContain("1200-2000");
    expect(message).toContain("from 6000");
    expect(message).toContain("from 2500");
  });
});
