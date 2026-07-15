import { Prisma } from "@prisma/client";
import { buildAiCommercialDraft } from "./generation-service";
import { bulkOutreachGenerateSchema } from "@/lib/validation/freelance";
import { freelanceRepositories, recomputeBulkOutreachBatchCounters, type OwnerScope } from "./repositories";
import { requireOwnerScope } from "./repositories";

export async function getBulkOutreachBatch(scope: OwnerScope, batchId: string) {
  const { userId } = requireOwnerScope(scope);
  return freelanceRepositories.bulkOutreachBatches.findFirst({
    where: { id: batchId, userId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: { lead: true }
      }
    }
  });
}

async function findTemplateForBatch(scope: OwnerScope, batch: { templateId: string | null; channel: string }) {
  if (batch.templateId) {
    return freelanceRepositories.templates.findFirst({
      where: { id: batch.templateId, OR: [{ userId: scope.userId }, { userId: null }] }
    });
  }

  return freelanceRepositories.templates.findFirst({
    where: {
      stage: "first_contact",
      isActive: true,
      OR: [{ userId: scope.userId }, { userId: null }],
      channel: { in: [batch.channel, "any"] }
    },
    orderBy: [{ userId: "desc" }, { isDefault: "desc" }]
  });
}

export async function generateBulkOutreachBatch(scope: OwnerScope, batchId: string, payload: unknown) {
  const { userId } = requireOwnerScope(scope);
  const input = bulkOutreachGenerateSchema.parse(payload);
  const batch = await freelanceRepositories.bulkOutreachBatches.findFirst({
    where: { id: batchId, userId }
  });
  if (!batch) {
    throw new Error("Batch not found.");
  }

  const [template, settings, items] = await Promise.all([
    findTemplateForBatch(scope, batch),
    freelanceRepositories.settings.findUnique({ where: { userId } }),
    freelanceRepositories.bulkOutreachItems.findMany({
      where: {
        userId,
        batchId,
        ...(input.itemIds?.length ? { id: { in: input.itemIds } } : {}),
        status: input.retryFailed
          ? { in: ["queued", "generation_failed", "generated"] }
          : { in: ["queued", "generated"] }
      },
      include: { lead: { include: { campaign: true, websiteAnalyses: true } } },
      orderBy: { createdAt: "asc" }
    })
  ]);

  if (!template) {
    throw new Error("Template not found.");
  }

  await freelanceRepositories.bulkOutreachBatches.update({
    where: { id: batchId },
    data: { status: "running" }
  });

  for (const item of items) {
    try {
      await freelanceRepositories.bulkOutreachItems.update({
        where: { id: item.id },
        data: { status: "generating" }
      });
      const draft = await buildAiCommercialDraft({
        lead: item.lead,
        template,
        settings,
        channel: batch.channel === "email" ? "email" : "whatsapp"
      });
      await freelanceRepositories.bulkOutreachItems.update({
        where: { id: item.id },
        data: {
          status: "generated",
          templateId: template.id,
          subject: "subject" in draft ? draft.subject : null,
          body: "body" in draft ? draft.body : null,
          message: "message" in draft ? draft.message : null,
          generationInputContext: draft.inputContext as Prisma.InputJsonObject,
          generationErrorCode: null,
          generationErrorMessage: null
        }
      });
      await freelanceRepositories.outreachEvents.create({
        data: {
          userId,
          batchId,
          itemId: item.id,
          leadId: item.leadId,
          campaignId: item.campaignId,
          channel: batch.channel,
          stage: batch.stage,
          eventType: "generated",
          status: "generated",
          payload: draft.inputContext as Prisma.InputJsonObject
        }
      });
    } catch (error) {
      await freelanceRepositories.bulkOutreachItems.update({
        where: { id: item.id },
        data: {
          status: "generation_failed",
          generationErrorCode: "generation_failed",
          generationErrorMessage:
            error instanceof Error ? error.message : "Unable to generate this item."
        }
      });
    }
  }

  const refreshedBatch = await recomputeBulkOutreachBatchCounters(batchId);
  const completedBatch = await freelanceRepositories.bulkOutreachBatches.update({
    where: { id: batchId },
    data: {
      status: "completed",
      generatedAt: new Date(),
      completedAt: new Date(),
      generationContextSnapshot: {
        templateId: template.id,
        channel: batch.channel,
        sellerSettingsPresent: Boolean(settings)
      }
    }
  });
  const refreshedItems = await freelanceRepositories.bulkOutreachItems.findMany({
    where: { batchId, userId },
    orderBy: { createdAt: "asc" }
  });

  return {
    batch: { ...refreshedBatch, ...completedBatch },
    items: refreshedItems
  };
}
