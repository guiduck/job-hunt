import { describe, expect, it } from "vitest";
import {
  buildBulkCommercialDraft,
  buildWhatsAppFirstContactTemplateDraft,
  sanitizeWhatsAppTemplateVariable
} from "@/lib/generation/commercial-message-builder";

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
  it("builds WhatsApp first-contact template variables from seller pricing settings", () => {
    const draft = buildWhatsAppFirstContactTemplateDraft({
      lead,
      settings: {
        sellerName: "Guilherme",
        offerTitle: "sites e landing pages focados em conversao",
        landingPagePrice: "2500",
        installments: 6,
        deliveryTime: "15 days"
      } as never,
      customText: sanitizeWhatsAppTemplateVariable("o site pode explicar melhor os servicos e facilitar o pedido de orcamento pelo celular.\nlinha extra"),
      language: "pt-BR"
    });

    expect(draft.templateVariables).toMatchObject({
      "1": "pessoal",
      "2": "Guilherme",
      "3": "Example Clinic",
      "5": "sites e landing pages focados em conversao",
      "6": "a partir de R$ 2500",
      "7": "15 dias",
      "8": "6x sem juros"
    });
    expect(draft.templateVariables["9"]).not.toContain("\n");
    expect(draft.message).toContain("a partir de R$ 2500");
  });

  it("builds English WhatsApp first-contact template variables for non-Brazil leads", () => {
    const draft = buildWhatsAppFirstContactTemplateDraft({
      lead,
      settings: {
        sellerName: "Guilherme",
        landingPagePriceUsd: "1000",
        deliveryTime: "15 dias"
      } as never,
      customText: "the contact path could be clearer for mobile visitors looking for an estimate.",
      language: "en"
    });

    expect(draft.templateName).toBe("first_contact_website_v1");
    expect(draft.templateLanguage).toBe("en");
    expect(draft.templateVariables).toMatchObject({
      "1": "there",
      "2": "Guilherme",
      "3": "Example Clinic",
      "4": "Clinic in Austin",
      "5": "conversion-focused websites and landing pages",
      "6": "starting at US$ 1000",
      "7": "15 days",
      "8": "payment terms defined after scope review"
    });
    expect(draft.message).toContain("starting at US$ 1000");
  });
});
