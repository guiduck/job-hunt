import { Prisma } from "@prisma/client";
import {
  buildCommercialMessage,
  detectLeadMessageLanguage,
  type OutreachChannel
} from "@/lib/generation/commercial-message-builder";
import { buildLovablePrompt } from "@/lib/generation/lovable-prompt-builder";
import { freelanceRepositories, requireOwnerScope, type OwnerScope } from "./repositories";
import {
  lovableGenerationSchema,
  messageGenerationSchema
} from "@/lib/validation/freelance";

type AiTextInput = {
  fallback: string;
  system: string;
  instruction: string;
  context: Record<string, unknown>;
};

function cleanObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== null && entry !== undefined && entry !== "")
  ) as T;
}

function arrayFromJson(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function buildLeadContext({
  lead,
  settings,
  template,
  channel,
  variant
}: {
  lead: any;
  settings?: any;
  template?: any;
  channel?: OutreachChannel;
  variant?: string;
}) {
  const analysis = lead.websiteAnalyses?.[0];
  return cleanObject({
    generation: cleanObject({ channel, variant, targetLanguage: detectLeadMessageLanguage(lead) }),
    business: cleanObject({
      name: lead.businessName,
      category: lead.category ?? lead.campaign?.nicheNameSnapshot,
      city: lead.city,
      region: lead.region,
      country: lead.country,
      address: lead.address,
      phone: lead.phone,
      websiteUrl: lead.websiteUrl,
      socialUrl: lead.socialUrl,
      googleRating: lead.googleRating,
      googleReviewCount: lead.googleReviewCount
    }),
    review: cleanObject({
      websiteStatus: lead.websiteStatus,
      commercialStatus: lead.commercialStatus,
      temperature: lead.temperature,
      leadScore: lead.leadScore,
      contentScore: lead.contentScore,
      designScore: lead.designScore,
      performanceScore: lead.performanceScore,
      seoScore: lead.seoScore,
      demoUrl: lead.demoUrl,
      operatorNotes: lead.operatorNotes,
      classificationReasons: arrayFromJson(lead.classificationReasons)
    }),
    source: cleanObject({
      sourceName: lead.sourceName,
      sourceUrl: lead.sourceUrl,
      sourceQuery: lead.sourceQuery,
      sourceIdentifier: lead.sourceIdentifier,
      sourceEvidence: lead.sourceEvidence
    }),
    campaign: lead.campaign
      ? cleanObject({
          name: lead.campaign.name,
          niche: lead.campaign.nicheNameSnapshot,
          city: lead.campaign.city,
          region: lead.campaign.region,
          country: lead.campaign.country,
          marketScope: lead.campaign.marketScope
        })
      : undefined,
    websiteAnalysis: analysis
      ? cleanObject({
          requestedUrl: analysis.requestedUrl,
          finalUrl: analysis.finalUrl,
          httpStatus: analysis.httpStatus,
          reachable: analysis.reachable,
          httpsEnabled: analysis.httpsEnabled,
          redirected: analysis.redirected,
          detectedStatus: analysis.detectedStatus,
          title: analysis.title,
          metaDescription: analysis.metaDescription,
          headings: arrayFromJson(analysis.headings),
          ctaTexts: arrayFromJson(analysis.ctaTexts),
          phoneSignals: arrayFromJson(analysis.phoneSignals),
          whatsappSignals: arrayFromJson(analysis.whatsappSignals),
          emailSignals: arrayFromJson(analysis.emailSignals),
          evidencePoints: arrayFromJson(analysis.evidencePoints)
        })
      : undefined,
    seller: settings
      ? cleanObject({
          sellerName: settings.sellerName,
          sellerTitle: settings.sellerTitle,
          sellerEmail: settings.sellerEmail,
          sellerWhatsapp: settings.sellerWhatsapp,
          companyWebsite: settings.companyWebsite,
          portfolioUrl: settings.portfolioUrl,
          offerTitle: settings.offerTitle,
          offerDescription: settings.offerDescription,
          landingPagePrice: settings.landingPagePrice,
          installments: settings.installments,
          deliveryTime: settings.deliveryTime,
          extraContext: settings.extraContext
        })
      : undefined,
    template: template
      ? cleanObject({
          id: template.id,
          name: template.name,
          stage: template.stage,
          channel: template.channel,
          category: template.category,
          bodyTemplate: template.bodyTemplate
        })
      : undefined
  });
}

export async function generateAiText(input: AiTextInput) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return input.fallback;
  }

  const model = process.env.AI_FREELANCE_MODEL || "gpt-4o-mini";
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.55,
        messages: [
          { role: "system", content: input.system },
          {
            role: "user",
            content: `${input.instruction}\n\nUse every relevant field from this JSON context. Do not invent facts not present here.\n\n${JSON.stringify(input.context, null, 2)}`
          }
        ]
      })
    });
    if (!response.ok) {
      return input.fallback;
    }
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return payload.choices?.[0]?.message?.content?.trim() || input.fallback;
  } catch {
    return input.fallback;
  }
}

export async function getLatestGeneratedText(scope: OwnerScope, leadId: string) {
  const { userId } = requireOwnerScope(scope);
  return freelanceRepositories.generatedTexts.findMany({
    where: { userId, leadId },
    orderBy: { updatedAt: "desc" }
  });
}

export async function saveLatestGeneratedText({
  scope,
  leadId,
  kind,
  variant,
  text,
  templateId,
  stage,
  inputContext = {}
}: {
  scope: OwnerScope;
  leadId: string;
  kind: "lovable_prompt" | "commercial_message";
  variant: string;
  text: string;
  templateId?: string;
  stage?: "first_contact" | "follow_up";
  inputContext?: Record<string, unknown>;
}) {
  const { userId } = requireOwnerScope(scope);
  const existing = await freelanceRepositories.generatedTexts.findFirst({
    where: { userId, leadId, kind, variant, stage: stage ?? null }
  });
  const data = {
    text,
    templateId,
    inputContext: inputContext as Prisma.InputJsonObject
  };

  if (existing) {
    return freelanceRepositories.generatedTexts.update({
      where: { id: existing.id },
      data
    });
  }

  return freelanceRepositories.generatedTexts.create({
    data: {
      userId,
      leadId,
      kind,
      variant,
      text,
      templateId,
      stage,
      inputContext: inputContext as Prisma.InputJsonObject
    }
  });
}

export async function generateLovablePrompt(scope: OwnerScope, payload: unknown) {
  const input = lovableGenerationSchema.parse(payload);
  const [lead, settings] = await Promise.all([
    freelanceRepositories.leads.findFirst({
      where: { id: input.leadId, userId: scope.userId },
      include: { websiteAnalyses: true, campaign: true }
    }),
    freelanceRepositories.settings.findUnique({ where: { userId: scope.userId } })
  ]);
  if (!lead) {
    throw new Error("Lead not found.");
  }

  const fallback = buildLovablePrompt(lead, input.variant);
  const context = buildLeadContext({ lead, settings, variant: input.variant });
  const text = await generateAiText({
    fallback,
    context,
    system:
      "You create Lovable-ready product prompts for small-business websites. You are specific, practical, and grounded in supplied business evidence.",
    instruction:
      input.variant === "compact"
        ? "Write a compact Lovable prompt for this business. Include layout, copy, CTA, services, local trust signals, and visual direction."
        : input.variant === "generic"
          ? "Write a reusable Lovable prompt structure adapted to this niche and market, avoiding unverifiable claims."
          : "Write a complete Lovable prompt for a conversion-focused website/demo for this specific business. Include positioning, page sections, CTA copy, WhatsApp/contact flow, local SEO, visual style, and constraints."
  });

  return saveLatestGeneratedText({
    scope,
    leadId: lead.id,
    kind: "lovable_prompt",
    variant: input.variant,
    text,
    inputContext: context
  });
}

export async function buildAiCommercialDraft({
  lead,
  template,
  settings,
  channel
}: {
  lead: any;
  template: any;
  settings?: any;
  channel: OutreachChannel;
}) {
  const targetLanguage = detectLeadMessageLanguage(lead);
  const fallback = buildCommercialMessage({ lead, template, settings });
  const context = buildLeadContext({ lead, settings, template, channel });
  const text = await generateAiText({
    fallback,
    context,
    system:
      "You write honest, concise outreach for a freelance web/landing-page offer. You use only supplied evidence and never invent website audits, guarantees, discounts, testimonials, or private data.",
    instruction:
      targetLanguage === "pt-BR"
        ? `Gere uma mensagem de ${channel === "whatsapp" ? "WhatsApp" : "email"} em portugues do Brasil para primeiro contato comercial. Use tom humano, direto e consultivo. Mencione a oportunidade real do lead, o contexto do negocio, oferta, prazo/preco se existirem, e termine com uma pergunta simples. Nao use placeholders.`
        : `Generate a ${channel === "whatsapp" ? "WhatsApp" : "email"} first-contact commercial outreach message in English. Use a human, concise, consultative tone. Mention the lead's real opportunity, business context, offer, timeline/price if present, and end with one simple question. Do not use placeholders.`
  });

  if (channel === "email") {
    return {
      subject: `Website opportunity for ${lead.businessName}`,
      body: text,
      inputContext: context
    };
  }

  return {
    message: text,
    inputContext: context
  };
}

export async function generateCommercialMessage(scope: OwnerScope, payload: unknown) {
  const input = messageGenerationSchema.parse(payload);
  const channel = input.channel ?? "whatsapp";
  const [lead, template, settings] = await Promise.all([
    freelanceRepositories.leads.findFirst({
      where: { id: input.leadId, userId: scope.userId },
      include: { campaign: true, websiteAnalyses: true }
    }),
    freelanceRepositories.templates.findFirst({
      where: { id: input.templateId, OR: [{ userId: scope.userId }, { userId: null }] }
    }),
    freelanceRepositories.settings.findUnique({ where: { userId: scope.userId } })
  ]);

  if (!lead) throw new Error("Lead not found.");
  if (!template) throw new Error("Template not found.");

  const draft = await buildAiCommercialDraft({ lead, template, settings, channel });
  const text = "message" in draft ? (draft.message ?? "") : (draft.body ?? "");

  return saveLatestGeneratedText({
    scope,
    leadId: lead.id,
    kind: "commercial_message",
    variant: `${input.stage}_${channel}`,
    stage: input.stage,
    templateId: template.id,
    text,
    inputContext: draft.inputContext
  });
}