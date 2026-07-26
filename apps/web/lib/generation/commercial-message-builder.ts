import type {
  CommercialTemplate,
  FreelanceCampaign,
  FreelanceLead,
  SellerSettings
} from "@prisma/client";

type LeadWithCampaign = FreelanceLead & { campaign: FreelanceCampaign };
type TargetLanguage = "pt-BR" | "en";
export type OutreachChannel = "email" | "whatsapp";

function jsonArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeMarket(value?: string | null) {
  return value?.trim().toLowerCase();
}

export function detectLeadMessageLanguage(lead: LeadWithCampaign): TargetLanguage {
  const leadCountry = normalizeMarket(lead.country);
  const campaignCountry = normalizeMarket(lead.campaign.country);
  const marketScope = normalizeMarket(lead.campaign.marketScope);

  if (
    marketScope === "br" ||
    leadCountry === "br" ||
    leadCountry === "brazil" ||
    leadCountry === "brasil" ||
    campaignCountry === "br" ||
    campaignCountry === "brazil" ||
    campaignCountry === "brasil"
  ) {
    return "pt-BR";
  }

  return "en";
}

function languageDefaults(language: TargetLanguage, settings: SellerSettings | null) {
  if (language === "pt-BR") {
    return {
      demoUrl: "o link do demo",
      offerPrice: settings?.landingPagePrice ? `a partir de R$ ${String(settings.landingPagePrice)}` : "a partir de R$ 2500",
      installments: settings?.installments ? `ate ${String(settings.installments)}x sem juros` : "ate 6x sem juros",
      deliveryTime: settings?.deliveryTime ?? "15 dias",
      offerTitle: settings?.offerTitle ?? "uma landing page focada em conversao",
      offerDescription:
        settings?.offerDescription ?? "uma experiencia de site mais clara com chamadas de contato mais fortes",
      sellerName: settings?.sellerName ?? "Guilherme",
      sellerTitle: settings?.sellerTitle ?? "web designer",
      classificationReason: "oportunidade no site"
    };
  }

  return {
    demoUrl: "the demo link",
    offerPrice: settings?.landingPagePriceUsd ? `starting at US$ ${String(settings.landingPagePriceUsd)}` : "starting at US$ 1000",
    installments: settings?.installments ? `${String(settings.installments)} installments for Brazil only` : "installments for Brazil only",
    deliveryTime: settings?.deliveryTime ?? "15 days",
    offerTitle: settings?.offerTitle ?? "a conversion-focused landing page",
    offerDescription:
      settings?.offerDescription ?? "a clearer website experience with stronger contact calls-to-action",
    sellerName: settings?.sellerName ?? "Guilherme",
    sellerTitle: settings?.sellerTitle ?? "web designer",
    classificationReason: "website opportunity"
  };
}

function localizedSystemTemplate(template: CommercialTemplate, language: TargetLanguage) {
  if (language !== "pt-BR" || !template.isDefault) {
    return template.bodyTemplate;
  }

  if (template.stage === "follow_up") {
    return "Oi {{business_name}}, passando para retomar a ideia da landing page. O link do demo e {{demo_url}}. Se fizer sentido, posso adaptar com seus servicos, fotos e fluxo de contato.";
  }

  return "Oi {{business_name}}, revisei sua presenca online e encontrei uma oportunidade pratica para melhorar a conversao para {{niche}} em {{city}}. Posso preparar uma landing page/demo focada por {{offer_price}} com entrega em {{delivery_time}}.";
}

export function buildCommercialMessage({
  lead,
  template,
  settings
}: {
  lead: LeadWithCampaign;
  template: CommercialTemplate;
  settings: SellerSettings | null;
}) {
  const targetLanguage = detectLeadMessageLanguage(lead);
  const defaults = languageDefaults(targetLanguage, settings);
  const variables: Record<string, string> = {
    business_name: lead.businessName,
    niche: lead.category ?? lead.campaign.nicheNameSnapshot,
    city: lead.city,
    demo_url: lead.demoUrl ?? defaults.demoUrl,
    offer_price: defaults.offerPrice,
    base_price_brl: settings?.landingPagePrice ? String(settings.landingPagePrice) : "2500",
    base_price_usd: settings?.landingPagePriceUsd ? String(settings.landingPagePriceUsd) : "1000",
    advanced_price_range_brl: settings?.advancedPriceRangeBrl ?? "3000-5000",
    advanced_price_range_usd: settings?.advancedPriceRangeUsd ?? "1200-2000",
    automation_price_range_brl: settings?.automationPriceRangeBrl ?? "above 5000",
    automation_price_range_usd: settings?.automationPriceRangeUsd ?? "above 2000",
    installments: defaults.installments,
    delivery_time: defaults.deliveryTime,
    offer_title: defaults.offerTitle,
    offer_description: defaults.offerDescription,
    company_website: settings?.companyWebsite ?? "",
    portfolio_url: settings?.portfolioUrl ?? "",
    website_score: String(lead.leadScore),
    seller_name: defaults.sellerName,
    seller_title: defaults.sellerTitle,
    seller_email: settings?.sellerEmail ?? "",
    seller_whatsapp: settings?.sellerWhatsapp ?? "",
    seller_linkedin_url: settings?.sellerLinkedinUrl ?? "",
    classification_reason: jsonArray(lead.classificationReasons).join("; ") || defaults.classificationReason,
    target_language: targetLanguage
  };

  let text = localizedSystemTemplate(template, targetLanguage);
  for (const [key, value] of Object.entries(variables)) {
    text = text.replaceAll(`{{${key}}}`, value);
  }

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

export function formatCommercialMessageForChannel(text: string, channel: OutreachChannel) {
  const normalized = text.replace(/\n{3,}/g, "\n\n").trim();
  if (channel !== "whatsapp") {
    return normalized;
  }

  return normalized
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_match, label: string, url: string) => {
      const cleanLabel = label.trim();
      const cleanUrl = url.trim();
      const comparableLabel = cleanLabel.replace(/^https?:\/\//i, "").replace(/\/$/, "");
      const comparableUrl = cleanUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "");
      return comparableLabel === comparableUrl ? cleanUrl : `${cleanLabel}: ${cleanUrl}`;
    })
    .replace(/voc? pode me contatar pelo whatsapp ou responder aqui mesmo[.!]?/gi, "Pode responder por aqui mesmo.")
    .replace(/voce pode me contatar pelo whatsapp ou responder aqui mesmo[.!]?/gi, "Pode responder por aqui mesmo.")
    .replace(/pode me chamar pelo whatsapp ou responder por aqui[.!]?/gi, "Pode responder por aqui mesmo.")
    .replace(/you can contact me on whatsapp or reply here[.!]?/gi, "You can reply here.")
    .replace(/you can message me on whatsapp or reply here[.!]?/gi, "You can reply here.")
    .trim();
}

export function buildBulkCommercialDraft({
  lead,
  template,
  settings,
  channel
}: {
  lead: LeadWithCampaign;
  template: CommercialTemplate;
  settings: SellerSettings | null;
  channel: OutreachChannel;
}) {
  const targetLanguage = detectLeadMessageLanguage(lead);
  const message = formatCommercialMessageForChannel(
    buildCommercialMessage({ lead, template, settings }),
    channel
  );
  if (channel === "whatsapp") {
    return {
      message,
      inputContext: {
        channel,
        leadId: lead.id,
        templateId: template.id,
        sellerSettingsPresent: Boolean(settings),
        targetLanguage
      }
    };
  }

  return {
    subject:
      targetLanguage === "pt-BR"
        ? `Ideia rapida para ${lead.businessName}`
        : `Quick idea for ${lead.businessName}`,
    body: message,
    inputContext: {
      channel,
      leadId: lead.id,
      templateId: template.id,
      sellerSettingsPresent: Boolean(settings),
      targetLanguage
    }
  };
}

export function findTemplateVariables(template: string) {
  return [...template.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map((match) => match[1]);
}
