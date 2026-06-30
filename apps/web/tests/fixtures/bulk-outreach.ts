import type { OutreachChannel } from "@prisma/client";

export const bulkOutreachUserId = "bulk-outreach-user";
export const bulkOutreachCampaignId = "campaign_bulk_1";
export const bulkOutreachTemplateId = "template_bulk_1";

export function bulkOutreachLeadFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "lead_bulk_1",
    userId: bulkOutreachUserId,
    campaignId: bulkOutreachCampaignId,
    businessName: "Example Clinic",
    category: "Clinic",
    country: "United States",
    city: "Austin",
    email: "owner@example.com",
    phone: "+15555550123",
    whatsapp: "+15555550123",
    websiteUrl: "https://exampleclinic.com",
    socialUrl: null,
    sourceEvidence: "Google Maps result with public contact details.",
    classificationReasons: ["weak website"],
    commercialStatus: "new",
    ...overrides
  };
}

export function bulkOutreachReadinessFixture(channel: OutreachChannel = "email") {
  return {
    channel,
    providerName: channel === "email" ? "resend" : "twilio",
    status: "missing_config",
    requiredEnvVars: channel === "email" ? ["RESEND_API_KEY"] : ["TWILIO_ACCOUNT_SID"],
    missingEnvVars: channel === "email" ? ["RESEND_API_KEY"] : ["TWILIO_ACCOUNT_SID"],
    dailyLimit: 500,
    remainingToday: 500,
    diagnosticCode: "missing_env",
    diagnosticMessage:
      channel === "email"
        ? "Configure RESEND_API_KEY before sending email."
        : "Configure TWILIO_ACCOUNT_SID before sending WhatsApp messages."
  };
}
