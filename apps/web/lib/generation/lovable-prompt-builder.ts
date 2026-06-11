import type { FreelanceCampaign, FreelanceLead, WebsiteAnalysis } from "@prisma/client";

export type LovablePromptVariant = "complete" | "generic" | "compact";

type LeadWithContext = FreelanceLead & {
  campaign: FreelanceCampaign;
  websiteAnalyses?: WebsiteAnalysis[];
};

function jsonArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function buildLovablePrompt(lead: LeadWithContext, variant: LovablePromptVariant) {
  const analysis = lead.websiteAnalyses?.[0];
  const evidence = analysis ? jsonArray(analysis.evidencePoints) : jsonArray(lead.classificationReasons);
  const base = [
    `Build a high-converting landing page for ${lead.businessName}.`,
    `Market: ${lead.city}, ${lead.country}.`,
    `Niche: ${lead.category ?? lead.campaign.nicheNameSnapshot}.`,
    `Website status: ${lead.websiteStatus}. Opportunity score: ${lead.leadScore}.`,
    lead.demoUrl ? `Use this demo/reference URL as context: ${lead.demoUrl}.` : "",
    evidence.length ? `Evidence: ${evidence.join("; ")}.` : ""
  ].filter(Boolean);

  if (variant === "compact") {
    return [
      ...base,
      "Create a concise mobile-first landing page with one primary CTA, services, trust signals, and contact options."
    ].join("\n");
  }

  if (variant === "generic") {
    return [
      ...base,
      "Create a reusable small-business landing page structure that can be adapted to this niche without using unverifiable claims."
    ].join("\n");
  }

  return [
    ...base,
    "Include a hero section, services, local trust signals, before/after opportunity framing, contact CTA, WhatsApp-ready copy, mobile-first layout, and local SEO sections.",
    "Avoid automatic outreach, fake testimonials, and job/recruiting language."
  ].join("\n");
}
