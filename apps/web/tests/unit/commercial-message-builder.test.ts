import { describe, expect, it } from "vitest";
import {
  buildCommercialMessage,
  detectLeadMessageLanguage,
  findTemplateVariables,
  formatCommercialMessageForChannel
} from "@/lib/generation/commercial-message-builder";

describe("commercial message builder", () => {
  it("replaces lead and seller variables", () => {
    const message = buildCommercialMessage({
      lead: {
        businessName: "Studio Bela",
        city: "Indaial",
        country: "United States",
        leadScore: 81,
        demoUrl: "https://demo.example",
        category: "Beauty salon",
        classificationReasons: ["Weak service pages"],
        campaign: { nicheNameSnapshot: "Beauty salon", country: "United States", marketScope: "INTL" }
      } as never,
      template: {
        bodyTemplate: "Hi {{business_name}}, I made {{offer_title}} for {{city}}. - {{seller_name}}",
        isDefault: false,
        stage: "first_contact"
      } as never,
      settings: { offerTitle: "a demo landing page", sellerName: "Guilherme" } as never
    });

    expect(message).toBe("Hi Studio Bela, I made a demo landing page for Indaial. - Guilherme");
  });

  it("uses Portuguese copy for Brazilian leads with system templates", () => {
    const lead = {
      businessName: "VGLAM - Clinica de Estetica Asa Norte",
      city: "Brasilia",
      country: "Brasil",
      leadScore: 81,
      demoUrl: null,
      category: "Clinica de estetica",
      classificationReasons: [],
      campaign: { nicheNameSnapshot: "Clinica de estetica", country: "Brasil", marketScope: "BR" }
    } as never;

    const message = buildCommercialMessage({
      lead,
      template: {
        bodyTemplate: "Hi {{business_name}}, I reviewed your current online presence.",
        isDefault: true,
        stage: "first_contact"
      } as never,
      settings: null
    });

    expect(detectLeadMessageLanguage(lead)).toBe("pt-BR");
    expect(message).toContain("Oi VGLAM");
    expect(message).toContain("revisei sua presenca online");
  });

  it("keeps English copy for international leads", () => {
    const lead = {
      businessName: "Example Clinic",
      city: "Austin",
      country: "United States",
      leadScore: 81,
      demoUrl: null,
      category: "Clinic",
      classificationReasons: [],
      campaign: { nicheNameSnapshot: "Clinic", country: "United States", marketScope: "INTL" }
    } as never;

    const message = buildCommercialMessage({
      lead,
      template: {
        bodyTemplate: "Hi {{business_name}}, I reviewed your current online presence.",
        isDefault: true,
        stage: "first_contact"
      } as never,
      settings: null
    });

    expect(detectLeadMessageLanguage(lead)).toBe("en");
    expect(message).toBe("Hi Example Clinic, I reviewed your current online presence.");
  });

  it("formats AI output as plain WhatsApp text", () => {
    const message = formatCommercialMessageForChannel(
      "Guilherme\n[www.gfig.space](https://www.gfig.space)\n[LinkedIn](https://linkedin.com/in/guilherme)\nVoce pode me contatar pelo WhatsApp ou responder aqui mesmo!",
      "whatsapp"
    );

    expect(message).toContain("https://www.gfig.space");
    expect(message).toContain("LinkedIn: https://linkedin.com/in/guilherme");
    expect(message).toContain("Pode responder por aqui mesmo.");
    expect(message).not.toContain("](http");
    expect(message).not.toMatch(/contatar pelo WhatsApp/i);
  });

  it("detects variables in templates", () => {
    expect(findTemplateVariables("{{business_name}} {{demo_url}}")).toEqual([
      "business_name",
      "demo_url"
    ]);
  });
});
