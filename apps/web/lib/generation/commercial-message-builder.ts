import type {
  CommercialTemplate,
  FreelanceCampaign,
  FreelanceLead,
  SellerSettings
} from "@prisma/client";
import {
  WHATSAPP_FIRST_CONTACT_CUSTOM_TEXT_MAX_LENGTH,
  WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY,
  WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY_EN,
  WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME,
  WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME_EN
} from "@/lib/freelance/whatsapp-template-definition";

export {
  WHATSAPP_FIRST_CONTACT_CUSTOM_TEXT_MAX_LENGTH,
  WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY,
  WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY_EN,
  WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME,
  WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME_EN
} from "@/lib/freelance/whatsapp-template-definition";


type LeadWithCampaign = FreelanceLead & { campaign: FreelanceCampaign };
type TargetLanguage = "pt-BR" | "en";
export type OutreachChannel = "email" | "whatsapp";

type WhatsAppServiceCategory =
  | "institutional_website"
  | "landing_page_conversion"
  | "technical_seo"
  | "website_performance"
  | "user_experience"
  | "customer_service_automation"
  | "custom_management_system";

const serviceCategoryLabels: Record<WhatsAppServiceCategory, Record<TargetLanguage, string>> = {
  institutional_website: {
    "pt-BR": "website institucional e apresentação dos serviços",
    en: "a business website and service presentation"
  },
  landing_page_conversion: {
    "pt-BR": "landing page e conversão",
    en: "landing-page conversion"
  },
  technical_seo: {
    "pt-BR": "SEO técnico e presença local",
    en: "technical SEO and local presence"
  },
  website_performance: {
    "pt-BR": "performance do website",
    en: "website performance"
  },
  user_experience: {
    "pt-BR": "experiência do usuário e apresentação dos serviços",
    en: "user experience and service presentation"
  },
  customer_service_automation: {
    "pt-BR": "automação do atendimento",
    en: "customer-service automation"
  },
  custom_management_system: {
    "pt-BR": "sistema de gestão personalizado",
    en: "a custom business-management system"
  }
};

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



export function sanitizeWhatsAppTemplateVariable(value: string, maxLength = 1600) {
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
    .trim();
}

function requiredWhatsAppTemplateVariable(value: unknown, fallback: string, maxLength: number) {
  const sanitized = sanitizeWhatsAppTemplateVariable(String(value ?? ""), maxLength);
  return sanitized || fallback;
}

function formatInstallments(value: unknown) {
  if (!value) return "6x sem juros";
  return `${String(value).trim()}x sem juros`;
}

function formattedCurrencyValue(value: unknown, language: TargetLanguage) {
  const fallback = language === "pt-BR" ? 2500 : 1000;
  const numericValue = Number(String(value ?? fallback).replace(/[^0-9.,-]/g, "").replace(",", "."));
  const amount = Number.isFinite(numericValue) ? numericValue : fallback;
  const formatted = new Intl.NumberFormat(language === "pt-BR" ? "pt-BR" : "en-US", {
    maximumFractionDigits: 0
  }).format(amount);
  return language === "pt-BR" ? `R$ ${formatted}` : `US$ ${formatted}`;
}

function leadEvidenceText(lead: LeadWithCampaign) {
  return [
    ...jsonArray(lead.classificationReasons),
    typeof lead.operatorNotes === "string" ? lead.operatorNotes : ""
  ]
    .join(" ")
    .toLowerCase();
}

function detectWhatsAppServiceCategory(lead: LeadWithCampaign): WhatsAppServiceCategory {
  if (["no_site", "social_only", "linktree", "aggregator", "broken"].includes(lead.websiteStatus)) {
    return "institutional_website";
  }

  const evidence = leadEvidenceText(lead);
  if (/\b(crm|database|admin|management|gest[aã]o|banco de dados)\b/.test(evidence)) {
    return "custom_management_system";
  }
  if (/\b(automation|automação|workflow|whatsapp|booking|agendamento|atendimento)\b/.test(evidence)) {
    return "customer_service_automation";
  }
  if (/\b(performance|speed|slow|loading|lent[oa]|carregamento)\b/.test(evidence)) {
    return "website_performance";
  }
  if (/\b(seo|index|indexação|ranking|search|busca|google|meta description)\b/.test(evidence)) {
    return "technical_seo";
  }
  if (/\b(navigation|mobile|design|content|services|contact|navegação|conteúdo|serviços|contato)\b/.test(evidence)) {
    return "user_experience";
  }
  if (/\b(cta|conversion|conversão|orçamento|quote|offer|oferta)\b/.test(evidence)) {
    return "landing_page_conversion";
  }
  return lead.websiteStatus === "weak_site" ? "user_experience" : "landing_page_conversion";
}

export function buildWhatsAppFirstContactServiceCategory(
  lead: LeadWithCampaign,
  language: TargetLanguage = detectLeadMessageLanguage(lead)
) {
  return serviceCategoryLabels[detectWhatsAppServiceCategory(lead)][language];
}

export function buildWhatsAppFirstContactFallbackDiagnosis(
  lead: LeadWithCampaign,
  language: TargetLanguage = detectLeadMessageLanguage(lead)
) {
  const status = lead.websiteStatus;
  const base = language === "pt-BR"
    ? status === "no_site"
      ? "a empresa ainda não possui um website próprio que reúna seus serviços, diferenciais e formas de contato em um único canal."
      : ["social_only", "linktree", "aggregator"].includes(status)
        ? "a presença online depende de plataformas de terceiros e não reúne serviços, diferenciais e formas de contato em um canal próprio."
        : status === "broken"
          ? "o website informado não estava acessível, o que pode impedir potenciais clientes de conhecer os serviços e entrar em contato."
          : "a presença online pode apresentar os serviços, diferenciais e formas de contato com mais clareza para transformar buscas em novos contatos."
    : status === "no_site"
      ? "the business does not yet have its own website bringing its services, differentiators, and contact options together in one place."
      : ["social_only", "linktree", "aggregator"].includes(status)
        ? "the online presence depends on third-party platforms and does not bring services, differentiators, and contact options together on an owned channel."
        : status === "broken"
          ? "the listed website was not accessible, which may prevent potential customers from learning about the services and getting in touch."
          : "the online presence could present services, differentiators, and contact options more clearly to turn searches into new inquiries.";
  return sanitizeWhatsAppTemplateVariable(base, WHATSAPP_FIRST_CONTACT_CUSTOM_TEXT_MAX_LENGTH);
}

export function buildWhatsAppFirstContactTemplateDraft({
  lead,
  settings,
  diagnosis,
  serviceCategory,
  language = detectLeadMessageLanguage(lead)
}: {
  lead: LeadWithCampaign;
  settings: SellerSettings | null;
  diagnosis: string;
  serviceCategory?: string;
  language?: TargetLanguage;
}) {
  const defaults = languageDefaults(language, settings);
  const niche =
    lead.category?.trim() ||
    lead.campaign.nicheNameSnapshot?.trim() ||
    (language === "pt-BR" ? "negocio local" : "local business");
  const templateName =
    language === "pt-BR" ? WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME : WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME_EN;
  const templateBody =
    language === "pt-BR" ? WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY : WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY_EN;
  const city = lead.city?.trim() || (language === "pt-BR" ? "sua cidade" : "your city");
  const price = formattedCurrencyValue(
    language === "pt-BR" ? settings?.landingPagePrice : settings?.landingPagePriceUsd,
    language
  );
  const deliveryTime = language === "pt-BR" ? settings?.deliveryTime?.trim() || defaults.deliveryTime : "15 days";
  const paymentTerms =
    language === "pt-BR" ? formatInstallments(settings?.installments) : "payment terms defined after scope review";
  const variables: Record<string, string> = {
    "1": requiredWhatsAppTemplateVariable(settings?.sellerName, defaults.sellerName, 120),
    "2": requiredWhatsAppTemplateVariable(
      lead.businessName,
      language === "pt-BR" ? "sua empresa" : "your business",
      160
    ),
    "3": requiredWhatsAppTemplateVariable(niche, language === "pt-BR" ? "negócio local" : "local business", 160),
    "4": requiredWhatsAppTemplateVariable(city, language === "pt-BR" ? "sua cidade" : "your city", 160),
    "5": requiredWhatsAppTemplateVariable(
      serviceCategory ?? buildWhatsAppFirstContactServiceCategory(lead, language),
      language === "pt-BR" ? "website institucional" : "a business website",
      180
    ),
    "6": requiredWhatsAppTemplateVariable(
      diagnosis,
      buildWhatsAppFirstContactFallbackDiagnosis(lead, language),
      WHATSAPP_FIRST_CONTACT_CUSTOM_TEXT_MAX_LENGTH
    ),
    "7": requiredWhatsAppTemplateVariable(price, language === "pt-BR" ? "R$ 2.500" : "US$ 1,000", 80),
    "8": requiredWhatsAppTemplateVariable(deliveryTime, defaults.deliveryTime, 80),
    "9": requiredWhatsAppTemplateVariable(
      paymentTerms,
      language === "pt-BR" ? "6x sem juros" : "payment terms defined after scope review",
      120
    ),
    "10": requiredWhatsAppTemplateVariable(
      settings?.portfolioUrl?.trim() || settings?.companyWebsite?.trim(),
      "www.gfig.space",
      240
    )
  };

  let message = templateBody;
  for (const [key, value] of Object.entries(variables)) {
    message = message.replaceAll(`{{${key}}}`, value);
  }

  return {
    message,
    templateName,
    templateLanguage: language,
    templateVariables: variables
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
