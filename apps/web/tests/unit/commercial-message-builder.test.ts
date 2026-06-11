import { describe, expect, it } from "vitest";
import {
  buildCommercialMessage,
  findTemplateVariables
} from "@/lib/generation/commercial-message-builder";

describe("commercial message builder", () => {
  it("replaces lead and seller variables", () => {
    const message = buildCommercialMessage({
      lead: {
        businessName: "Studio Bela",
        city: "Indaial",
        leadScore: 81,
        demoUrl: "https://demo.example",
        category: "Beauty salon",
        classificationReasons: ["Weak service pages"],
        campaign: { nicheNameSnapshot: "Beauty salon" }
      } as never,
      template: {
        bodyTemplate: "Hi {{business_name}}, I made {{offer_title}} for {{city}}. - {{seller_name}}"
      } as never,
      settings: { offerTitle: "a demo landing page", sellerName: "Guilherme" } as never
    });

    expect(message).toBe("Hi Studio Bela, I made a demo landing page for Indaial. - Guilherme");
  });

  it("detects variables in templates", () => {
    expect(findTemplateVariables("{{business_name}} {{demo_url}}")).toEqual([
      "business_name",
      "demo_url"
    ]);
  });
});
