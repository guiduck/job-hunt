import { describe, expect, it } from "vitest";
import { buildBulkCommercialDraft } from "@/lib/generation/commercial-message-builder";

const lead = {
  id: "lead_1",
  businessName: "Example Clinic",
  category: "Clinic",
  city: "Austin",
  demoUrl: "https://demo.example.com",
  leadScore: 84,
  classificationReasons: ["homepage has weak CTA"],
  campaign: { nicheNameSnapshot: "Clinic" }
} as never;

const template = {
  id: "template_1",
  bodyTemplate:
    "Hi {{business_name}}, I noticed {{classification_reason}} in {{city}}. I can help with {{offer_title}}. {{portfolio_url}}"
} as never;

const settings = {
  offerTitle: "a clearer landing page",
  portfolioUrl: "https://portfolio.example.com",
  sellerName: "Guilherme"
} as never;

describe("bulk generation context", () => {
  it("builds Email subject/body from lead evidence, template, and seller settings", () => {
    const draft = buildBulkCommercialDraft({ lead, template, settings, channel: "email" });

    expect(draft).toMatchObject({
      subject: "Quick idea for Example Clinic"
    });
    expect("body" in draft ? draft.body : "").toContain("Example Clinic");
    expect("body" in draft ? draft.body : "").toContain("homepage has weak CTA");
    expect(draft.inputContext).toMatchObject({ channel: "email", leadId: "lead_1" });
  });

  it("builds WhatsApp message without Email-only subject", () => {
    const draft = buildBulkCommercialDraft({ lead, template, settings, channel: "whatsapp" });

    expect("message" in draft ? draft.message : "").toContain("Example Clinic");
    expect("subject" in draft).toBe(false);
  });
});
