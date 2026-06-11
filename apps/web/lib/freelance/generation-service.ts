import { Prisma } from "@prisma/client";
import { buildCommercialMessage } from "@/lib/generation/commercial-message-builder";
import { buildLovablePrompt } from "@/lib/generation/lovable-prompt-builder";
import { freelanceRepositories, requireOwnerScope, type OwnerScope } from "./repositories";
import {
  lovableGenerationSchema,
  messageGenerationSchema
} from "@/lib/validation/freelance";

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
  const lead = await freelanceRepositories.leads.findFirst({
    where: { id: input.leadId, userId: scope.userId },
    include: { websiteAnalyses: true, campaign: true }
  });
  if (!lead) {
    throw new Error("Lead not found.");
  }

  const text = buildLovablePrompt(lead, input.variant);

  return saveLatestGeneratedText({
    scope,
    leadId: lead.id,
    kind: "lovable_prompt",
    variant: input.variant,
    text,
    inputContext: { leadId: lead.id, variant: input.variant }
  });
}

export async function generateCommercialMessage(scope: OwnerScope, payload: unknown) {
  const input = messageGenerationSchema.parse(payload);
  const [lead, template, settings] = await Promise.all([
    freelanceRepositories.leads.findFirst({
      where: { id: input.leadId, userId: scope.userId },
      include: { campaign: true }
    }),
    freelanceRepositories.templates.findFirst({
      where: { id: input.templateId, OR: [{ userId: scope.userId }, { userId: null }] }
    }),
    freelanceRepositories.settings.findUnique({ where: { userId: scope.userId } })
  ]);

  if (!lead) throw new Error("Lead not found.");
  if (!template) throw new Error("Template not found.");

  const text = buildCommercialMessage({ lead, template, settings });

  return saveLatestGeneratedText({
    scope,
    leadId: lead.id,
    kind: "commercial_message",
    variant: input.stage,
    stage: input.stage,
    templateId: template.id,
    text,
    inputContext: { leadId: lead.id, stage: input.stage, templateId: template.id }
  });
}
