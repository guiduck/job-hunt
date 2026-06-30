import type {
  CommercialTemplate,
  FreelanceCampaign,
  FreelanceLead,
  SellerSettings
} from "@prisma/client";

type LeadWithCampaign = FreelanceLead & { campaign: FreelanceCampaign };

function jsonArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
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
  const variables: Record<string, string> = {
    business_name: lead.businessName,
    niche: lead.category ?? lead.campaign.nicheNameSnapshot,
    city: lead.city,
    demo_url: lead.demoUrl ?? "the demo link",
    offer_price: settings?.landingPagePrice ? String(settings.landingPagePrice) : "a fixed project price",
    installments: settings?.installments ? String(settings.installments) : "flexible installments",
    delivery_time: settings?.deliveryTime ?? "a short delivery window",
    offer_title: settings?.offerTitle ?? "a conversion-focused landing page",
    offer_description:
      settings?.offerDescription ?? "a clearer website experience with stronger contact calls-to-action",
    portfolio_url: settings?.portfolioUrl ?? "",
    website_score: String(lead.leadScore),
    seller_name: settings?.sellerName ?? "Guilherme",
    seller_title: settings?.sellerTitle ?? "web designer",
    seller_email: settings?.sellerEmail ?? "",
    seller_whatsapp: settings?.sellerWhatsapp ?? "",
    classification_reason: jsonArray(lead.classificationReasons).join("; ") || "website opportunity"
  };

  let text = template.bodyTemplate;
  for (const [key, value] of Object.entries(variables)) {
    text = text.replaceAll(`{{${key}}}`, value);
  }

  return text.replace(/\n{3,}/g, "\n\n").trim();
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
  channel: "email" | "whatsapp";
}) {
  const message = buildCommercialMessage({ lead, template, settings });
  if (channel === "whatsapp") {
    return {
      message,
      inputContext: {
        channel,
        leadId: lead.id,
        templateId: template.id,
        sellerSettingsPresent: Boolean(settings)
      }
    };
  }

  return {
    subject: `Quick idea for ${lead.businessName}`,
    body: message,
    inputContext: {
      channel,
      leadId: lead.id,
      templateId: template.id,
      sellerSettingsPresent: Boolean(settings)
    }
  };
}

export function findTemplateVariables(template: string) {
  return [...template.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map((match) => match[1]);
}
