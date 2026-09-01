import { describe, expect, it } from "vitest";
import {
  buildBulkCommercialDraft,
  buildWhatsAppFirstContactFallbackDiagnosis,
  buildWhatsAppFirstContactServiceCategory,
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
        deliveryTime: "15 dias"
      } as never,
      diagnosis: sanitizeWhatsAppTemplateVariable("o site pode explicar melhor os serviços e facilitar o pedido de orçamento.\nlinha extra"),
      language: "pt-BR"
    });

    expect(draft.templateVariables).toMatchObject({
      "1": "Guilherme",
      "2": "Example Clinic",
      "3": "Clinic",
      "4": "Austin",
      "5": "landing page e conversão",
      "6": "o site pode explicar melhor os serviços e facilitar o pedido de orçamento. linha extra",
      "7": "R$ 2.500",
      "8": "15 dias",
      "9": "6x sem juros",
      "10": "www.gfig.space"
    });
    expect(draft.templateVariables["6"]).not.toContain("\n");
    expect(Object.keys(draft.templateVariables)).toEqual([
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"
    ]);
    expect(draft.message).toContain("Sites e landing pages começam em R$ 2.500");
    expect(draft.message).toContain("Eu desenvolvi uma ferramenta de análise avançada");
    expect(draft.message).toMatch(/Obrigado pela atenção\.$/);
  });

  it("builds English WhatsApp first-contact template variables for non-Brazil leads", () => {
    const draft = buildWhatsAppFirstContactTemplateDraft({
      lead,
      settings: {
        sellerName: "Guilherme",
        landingPagePriceUsd: "1000"
      } as never,
      diagnosis: "the service offer and contact path could be clearer for potential customers.",
      language: "en"
    });

    expect(draft.templateName).toBe("first_contact_website_v2");
    expect(draft.templateLanguage).toBe("en");
    expect(draft.templateVariables).toMatchObject({
      "1": "Guilherme",
      "2": "Example Clinic",
      "3": "Clinic",
      "4": "Austin",
      "5": "landing-page conversion",
      "6": "the service offer and contact path could be clearer for potential customers.",
      "7": "US$ 1,000",
      "8": "15 days",
      "9": "payment terms defined after scope review",
      "10": "www.gfig.space"
    });
    expect(draft.message).toContain("Websites and landing pages start at US$ 1,000");
    expect(draft.message).toMatch(/Thank you for your time\.$/);
  });

  it("maps a lead without a website to the predefined website service and evidence-based diagnosis", () => {
    const leadWithoutWebsite = {
      ...(lead as unknown as Record<string, unknown>),
      websiteStatus: "no_site",
      classificationReasons: ["No website URL was available for this lead."]
    } as never;

    expect(buildWhatsAppFirstContactServiceCategory(leadWithoutWebsite, "pt-BR")).toBe(
      "website institucional e apresentação dos serviços"
    );
    expect(buildWhatsAppFirstContactFallbackDiagnosis(leadWithoutWebsite, "pt-BR")).toContain(
      "a empresa ainda não possui um website próprio"
    );
  });
});
