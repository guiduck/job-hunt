import {
  Prisma,
  type BulkOutreachItem,
  type OutreachChannel,
  type TemplateStage
} from "@prisma/client";
import { bulkOutreachApproveSchema } from "@/lib/validation/freelance";
import { createEmailProvider } from "@/lib/providers/email-provider";
import { createWhatsAppProvider } from "@/lib/providers/whatsapp-provider";
import type {
  ChannelReadiness,
  DeliveryResult,
  EmailOutreachProvider,
  WhatsAppOutreachProvider
} from "@/lib/providers/outreach-provider";
import { findDuplicateFirstContactOutreach } from "./duplicate-outreach-service";
import { recordOutboundWhatsAppMessage } from "./whatsapp-conversation-service";
import {
  freelanceRepositories,
  recomputeBulkOutreachBatchCounters,
  requireOwnerScope,
  type OwnerScope
} from "./repositories";

export class ChannelNotReadyError extends Error {
  readonly statusCode = 409;
  constructor(readonly readiness: ChannelReadiness) {
    super(readiness.diagnosticMessage ?? "Channel is not ready for delivery.");
  }
}

export type DeliveryApprovalResult = {
  batch: Awaited<ReturnType<typeof recomputeBulkOutreachBatchCounters>>;
  results: Array<{
    itemId: string;
    status: string;
    providerName?: string;
    providerMessageId?: string;
    diagnosticCode?: string;
    diagnosticMessage?: string;
  }>;
  channelReadiness: ChannelReadiness;
};

function canSendItem(item: BulkOutreachItem) {
  if (item.channel === "email") {
    return item.status === "generated" && item.recipientEmail && item.subject && item.body;
  }
  return item.status === "generated" && item.recipientWhatsapp && item.message;
}

function eventTypeForBlockedItem(item: BulkOutreachItem) {
  if (item.status === "missing_contact") return "blocked_missing_contact" as const;
  if (item.status === "invalid_contact") return "blocked_invalid_contact" as const;
  if (item.status === "duplicate_blocked") return "blocked_duplicate" as const;
  return "failed_send" as const;
}

async function markExcludedItems(input: {
  scope: OwnerScope;
  batch: { id: string; stage: TemplateStage; channel: OutreachChannel };
  items: BulkOutreachItem[];
}) {
  for (const item of input.items) {
    if (item.status === "skipped" || item.status === "sent" || item.status === "failed_send") {
      continue;
    }
    if (canSendItem(item)) {
      continue;
    }
    await freelanceRepositories.outreachEvents.create({
      data: {
        userId: input.scope.userId,
        batchId: input.batch.id,
        itemId: item.id,
        leadId: item.leadId,
        campaignId: item.campaignId,
        channel: item.channel,
        stage: input.batch.stage,
        eventType: eventTypeForBlockedItem(item),
        status: item.status,
        recipient: item.recipientEmail ?? item.recipientWhatsapp ?? item.recipientPhone,
        subject: item.subject,
        diagnosticCode:
          item.validationErrorCode ?? item.generationErrorCode ?? "item_not_ready_for_delivery",
        diagnosticMessage:
          item.validationErrorMessage ??
          item.generationErrorMessage ??
          "Review this item before approving delivery."
      }
    });
  }
}

function getTwilioWhatsAppTemplate(item: BulkOutreachItem) {
  const context = item.generationInputContext;
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return undefined;
  }
  const template = (context as Record<string, unknown>).twilioWhatsAppTemplate;
  if (!template || typeof template !== "object" || Array.isArray(template)) {
    return undefined;
  }
  return template as Record<string, unknown>;
}

function getWhatsAppTemplateVariables(item: BulkOutreachItem) {
  const template = getTwilioWhatsAppTemplate(item);
  const variables = template?.contentVariables;
  if (!variables || typeof variables !== "object" || Array.isArray(variables)) {
    return undefined;
  }
  const entries = Object.entries(variables);
  if (!entries.every(([key, value]) => key && typeof value === "string")) {
    return undefined;
  }
  return Object.fromEntries(entries) as Record<string, string>;
}

function getWhatsAppTemplateLanguage(item: BulkOutreachItem) {
  const template = getTwilioWhatsAppTemplate(item);
  return template?.templateLanguage === "en" ? "en" : "pt-BR";
}
function providerForChannel(channel: OutreachChannel, provider?: EmailOutreachProvider | WhatsAppOutreachProvider) {
  if (provider) return provider;
  if (channel === "email") return createEmailProvider();
  return createWhatsAppProvider();
}

async function persistDeliveryResult(input: {
  userId: string;
  batchId: string;
  stage: TemplateStage;
  item: BulkOutreachItem;
  result: DeliveryResult;
}) {
  const sent = input.result.status === "sent";
  const status = sent ? "sent" : input.result.status === "blocked" ? "duplicate_blocked" : "failed_send";
  const item = await freelanceRepositories.bulkOutreachItems.update({
    where: { id: input.item.id },
    data: {
      status,
      sentAt: sent ? new Date() : null,
      providerName: input.result.providerName,
      providerMessageId: input.result.providerMessageId,
      providerStatus: input.result.providerStatus,
      providerErrorCode: sent ? null : input.result.diagnosticCode,
      providerErrorMessage: sent ? null : input.result.diagnosticMessage
    }
  });

  await freelanceRepositories.outreachEvents.create({
    data: {
      userId: input.userId,
      batchId: input.batchId,
      itemId: input.item.id,
      leadId: input.item.leadId,
      campaignId: input.item.campaignId,
      channel: input.item.channel,
      stage: input.stage,
      eventType: sent ? "sent" : "failed_send",
      status: item.status,
      providerName: input.result.providerName,
      providerMessageId: input.result.providerMessageId,
      recipient: item.recipientEmail ?? item.recipientWhatsapp ?? item.recipientPhone,
      subject: item.subject,
      diagnosticCode: input.result.diagnosticCode,
      diagnosticMessage: input.result.diagnosticMessage,
      payload: (input.result.safePayload ?? {}) as Prisma.InputJsonObject
    }
  });

  return item;
}

export async function approveBulkOutreachBatch(
  scope: OwnerScope,
  batchId: string,
  payload: unknown,
  providerOverride?: EmailOutreachProvider | WhatsAppOutreachProvider
): Promise<DeliveryApprovalResult> {
  const { userId } = requireOwnerScope(scope);
  bulkOutreachApproveSchema.parse(payload);
  const batch = await freelanceRepositories.bulkOutreachBatches.findFirst({
    where: { id: batchId, userId },
    include: { items: { orderBy: { createdAt: "asc" } } }
  });
  if (!batch) {
    throw new Error("Batch not found.");
  }

  const provider = providerForChannel(batch.channel, providerOverride);
  const readiness = await provider.getReadiness();
  if (readiness.status !== "ready" || (readiness.remainingToday ?? 0) <= 0) {
    await freelanceRepositories.bulkOutreachBatches.update({
      where: { id: batch.id },
      data: {
        diagnostics: [readiness] as unknown as Prisma.InputJsonArray,
        channelLimitSnapshot: readiness as unknown as Prisma.InputJsonObject
      }
    });
    await markExcludedItems({ scope, batch, items: batch.items });
    throw new ChannelNotReadyError({
      ...readiness,
      status: readiness.status === "ready" ? "rate_limited" : readiness.status,
      diagnosticCode:
        readiness.diagnosticCode ?? ((readiness.remainingToday ?? 0) <= 0 ? "daily_limit_reached" : "channel_not_ready"),
      diagnosticMessage:
        readiness.diagnosticMessage ??
        ((readiness.remainingToday ?? 0) <= 0
          ? "The configured daily limit has no remaining capacity today."
          : "The channel is not ready for delivery.")
    });
  }

  await markExcludedItems({ scope, batch, items: batch.items });
  const results: DeliveryApprovalResult["results"] = [];
  let remaining = readiness.remainingToday ?? readiness.dailyLimit ?? batch.items.length;

  for (const item of batch.items) {
    if (item.status === "sent") {
      results.push({
        itemId: item.id,
        status: "sent",
        providerName: item.providerName ?? undefined,
        providerMessageId: item.providerMessageId ?? undefined
      });
      continue;
    }
    if (!canSendItem(item)) {
      continue;
    }
    const duplicate = await findDuplicateFirstContactOutreach(scope, {
      leadId: item.leadId,
      campaignId: item.campaignId,
      channel: item.channel,
      stage: batch.stage
    });
    if (duplicate) {
      await freelanceRepositories.bulkOutreachItems.update({
        where: { id: item.id },
        data: {
          status: "duplicate_blocked",
          duplicateOfEventId: duplicate.id,
          validationErrorCode: "duplicate_outreach",
          validationErrorMessage:
            "This business already has first-contact outreach for this campaign and channel."
        }
      });
      results.push({
        itemId: item.id,
        status: "duplicate_blocked",
        diagnosticCode: "duplicate_outreach",
        diagnosticMessage:
          "This business already has first-contact outreach for this campaign and channel."
      });
      continue;
    }
    if (remaining <= 0) {
      await freelanceRepositories.bulkOutreachItems.update({
        where: { id: item.id },
        data: {
          status: "failed_send",
          providerName: readiness.providerName,
          providerErrorCode: "daily_limit_reached",
          providerErrorMessage: "The configured daily limit was reached before this item could send."
        }
      });
      results.push({
        itemId: item.id,
        status: "failed_send",
        providerName: readiness.providerName,
        diagnosticCode: "daily_limit_reached",
        diagnosticMessage: "The configured daily limit was reached before this item could send."
      });
      continue;
    }

    await freelanceRepositories.bulkOutreachItems.update({
      where: { id: item.id },
      data: {
        status: "sending",
        approvedAt: new Date(),
        providerName: readiness.providerName
      }
    });
    await freelanceRepositories.outreachEvents.create({
      data: {
        userId,
        batchId: batch.id,
        itemId: item.id,
        leadId: item.leadId,
        campaignId: item.campaignId,
        channel: item.channel,
        stage: batch.stage,
        eventType: "queued_send",
        status: "sending",
        providerName: readiness.providerName,
        recipient: item.recipientEmail ?? item.recipientWhatsapp ?? item.recipientPhone,
        subject: item.subject
      }
    });

    const result =
      batch.channel === "email"
        ? await (provider as EmailOutreachProvider).send({
            to: item.recipientEmail ?? "",
            subject: item.subject ?? "",
            body: item.body ?? "",
            metadata: { userId, batchId: batch.id, itemId: item.id, leadId: item.leadId }
          })
        : await (provider as WhatsAppOutreachProvider).send({
            to: item.recipientWhatsapp ?? item.recipientPhone ?? "",
            message: item.message ?? "",
            templateVariables: getWhatsAppTemplateVariables(item),
            templateLanguage: getWhatsAppTemplateLanguage(item),
            metadata: { userId, batchId: batch.id, itemId: item.id, leadId: item.leadId }
          });
    const updatedItem = await persistDeliveryResult({
      userId,
      batchId: batch.id,
      stage: batch.stage,
      item,
      result
    });
    remaining -= 1;
    results.push({
      itemId: item.id,
      status: updatedItem.status,
      providerName: result.providerName,
      providerMessageId: result.providerMessageId,
      diagnosticCode: result.diagnosticCode,
      diagnosticMessage: result.diagnosticMessage
    });
  }

  const counters = await recomputeBulkOutreachBatchCounters(batch.id);
  const status =
    counters.sentCount > 0 && counters.failedSendCount === 0 ? "sent" : counters.sentCount > 0 ? "partially_sent" : "approved";
  const completed = await freelanceRepositories.bulkOutreachBatches.update({
    where: { id: batch.id },
    data: {
      status,
      approvedAt: new Date(),
      completedAt: new Date(),
      channelLimitSnapshot: {
        ...readiness,
        remainingToday: Math.max(0, remaining)
      } as unknown as Prisma.InputJsonObject,
      diagnostics: [] as unknown as Prisma.InputJsonArray
    }
  });

  return {
    batch: { ...counters, ...completed },
    results,
    channelReadiness: {
      ...readiness,
      remainingToday: Math.max(0, remaining)
    }
  };
}

export async function getLeadOutreachEvents(scope: OwnerScope, leadId: string) {
  const { userId } = requireOwnerScope(scope);
  const lead = await freelanceRepositories.leads.findFirst({
    where: { id: leadId, userId },
    select: { id: true }
  });
  if (!lead) {
    throw new Error("Lead not found.");
  }
  return freelanceRepositories.outreachEvents.findMany({
    where: { leadId, userId },
    orderBy: { occurredAt: "desc" },
    take: 50
  });
}
