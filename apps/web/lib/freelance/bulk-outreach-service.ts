import type { OutreachChannel } from "@prisma/client";
import { ZodError } from "zod";
import {
  bulkOutreachCreateSchema,
  bulkOutreachItemUpdateSchema
} from "@/lib/validation/freelance";
import { findDuplicateFirstContactOutreach } from "./duplicate-outreach-service";
import {
  findOwnedFreelanceLeads,
  freelanceRepositories,
  recomputeBulkOutreachBatchCounters,
  requireOwnerScope,
  type OwnerScope
} from "./repositories";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

function isValidPhone(value?: string | null) {
  return (value ?? "").replace(/\D/g, "").length >= 8;
}

function getInitialItemState(input: {
  channel: OutreachChannel;
  lead: Awaited<ReturnType<typeof findOwnedFreelanceLeads>>[number];
  duplicateOfEventId?: string | null;
}) {
  if (input.duplicateOfEventId) {
    return {
      status: "duplicate_blocked" as const,
      validationErrorCode: "duplicate_outreach",
      validationErrorMessage:
        "This business already has first-contact outreach for this campaign and channel.",
      duplicateOfEventId: input.duplicateOfEventId
    };
  }

  if (input.channel === "email") {
    if (!input.lead.email) {
      return {
        status: "missing_contact" as const,
        recipientEmail: null,
        validationErrorCode: "missing_email",
        validationErrorMessage:
          "No email address was found for this lead, so it is excluded from Email delivery."
      };
    }
    if (!EMAIL_PATTERN.test(input.lead.email)) {
      return {
        status: "invalid_contact" as const,
        recipientEmail: input.lead.email,
        validationErrorCode: "invalid_email",
        validationErrorMessage: "Review and correct this email address before approval."
      };
    }
    return {
      status: "queued" as const,
      recipientEmail: input.lead.email
    };
  }

  const recipientWhatsapp = normalizePhone(input.lead.whatsapp ?? input.lead.phone);
  if (!recipientWhatsapp) {
    return {
      status: "missing_contact" as const,
      recipientWhatsapp: null,
      recipientPhone: null,
      validationErrorCode: "missing_whatsapp",
      validationErrorMessage:
        "No WhatsApp-ready phone number was found for this lead, so it is excluded from WhatsApp delivery."
    };
  }
  if (!isValidPhone(recipientWhatsapp)) {
    return {
      status: "invalid_contact" as const,
      recipientWhatsapp,
      recipientPhone: input.lead.phone,
      validationErrorCode: "invalid_phone",
      validationErrorMessage: "Review and correct this phone number before approval."
    };
  }
  return {
    status: "queued" as const,
    recipientWhatsapp,
    recipientPhone: input.lead.phone
  };
}

export async function createBulkOutreachBatch(scope: OwnerScope, payload: unknown) {
  const { userId } = requireOwnerScope(scope);
  const input = bulkOutreachCreateSchema.parse(payload);
  const uniqueLeadIds = Array.from(new Set(input.leadIds));
  const leads = await findOwnedFreelanceLeads(scope, uniqueLeadIds);

  if (leads.length !== uniqueLeadIds.length) {
    throw new Error("Only owned saved Freelance leads can enter a bulk outreach batch.");
  }

  const batch = await freelanceRepositories.bulkOutreachBatches.create({
    data: {
      userId,
      channel: input.channel,
      campaignId: input.campaignId ?? leads[0]?.campaignId ?? null,
      templateId: input.templateId,
      stage: input.stage,
      selectedCount: leads.length
    }
  });

  for (const lead of leads) {
    const duplicate = await findDuplicateFirstContactOutreach(scope, {
      leadId: lead.id,
      campaignId: input.campaignId ?? lead.campaignId,
      channel: input.channel,
      stage: input.stage
    });
    const itemState = getInitialItemState({
      channel: input.channel,
      lead,
      duplicateOfEventId: duplicate?.id
    });

    await freelanceRepositories.bulkOutreachItems.create({
      data: {
        userId,
        batchId: batch.id,
        leadId: lead.id,
        campaignId: input.campaignId ?? lead.campaignId,
        channel: input.channel,
        templateId: input.templateId,
        contactSource: "lead_existing",
        ...itemState
      }
    });
  }

  const refreshedBatch = await recomputeBulkOutreachBatchCounters(batch.id);
  const items = await freelanceRepositories.bulkOutreachItems.findMany({
    where: { batchId: batch.id, userId },
    orderBy: { createdAt: "asc" }
  });

  return { batch: refreshedBatch, items };
}

export function bulkOutreachErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return { status: 400, body: { error: "invalid_bulk_outreach_payload" } };
  }
  return {
    status: error instanceof Error && error.message.includes("owned") ? 403 : 400,
    body: { error: error instanceof Error ? error.message : "Unable to create bulk outreach batch." }
  };
}

export async function updateBulkOutreachItem(
  scope: OwnerScope,
  batchId: string,
  itemId: string,
  payload: unknown
) {
  const { userId } = requireOwnerScope(scope);
  const input = bulkOutreachItemUpdateSchema.parse(payload);
  const item = await freelanceRepositories.bulkOutreachItems.findFirst({
    where: { id: itemId, batchId, userId },
    include: { batch: true }
  });
  if (!item) {
    throw new Error("Item not found.");
  }

  const data: Record<string, unknown> = {
    operatorEditedAt: new Date()
  };

  if (input.skip) {
    data.status = "skipped";
    data.skipReason = input.skipReason || "Skipped by operator.";
  } else if (input.skip === false && item.status === "skipped") {
    data.skipReason = null;
    data.status = "generated";
  }

  if (item.channel === "email") {
    if (input.recipientEmail !== undefined) {
      data.recipientEmail = input.recipientEmail || null;
      data.contactSource = "manual_edit";
    }
    if (input.subject !== undefined) data.subject = input.subject || null;
    if (input.body !== undefined) data.body = input.body || null;
    const recipientEmail = String(data.recipientEmail ?? item.recipientEmail ?? "");
    const subject = String(data.subject ?? item.subject ?? "");
    const body = String(data.body ?? item.body ?? "");
    if (!input.skip && (!recipientEmail || !EMAIL_PATTERN.test(recipientEmail))) {
      data.status = "invalid_contact";
      data.validationErrorCode = "invalid_email";
      data.validationErrorMessage = "Review and correct this email address before approval.";
    } else if (!input.skip && (!subject.trim() || !body.trim())) {
      data.status = "invalid_contact";
      data.validationErrorCode = !subject.trim() ? "missing_subject" : "missing_body";
      data.validationErrorMessage = "Add an email subject and body before approval.";
    } else if (!input.skip) {
      data.status = "generated";
      data.validationErrorCode = null;
      data.validationErrorMessage = null;
    }
  } else {
    if (input.recipientWhatsapp !== undefined) {
      data.recipientWhatsapp = input.recipientWhatsapp || null;
      data.contactSource = "manual_edit";
    }
    if (input.recipientPhone !== undefined) data.recipientPhone = input.recipientPhone || null;
    if (input.message !== undefined) data.message = input.message || null;
    const target = String(data.recipientWhatsapp ?? data.recipientPhone ?? item.recipientWhatsapp ?? item.recipientPhone ?? "");
    const message = String(data.message ?? item.message ?? "");
    if (!input.skip && !isValidPhone(target)) {
      data.status = "invalid_contact";
      data.validationErrorCode = "invalid_phone";
      data.validationErrorMessage = "Review and correct this phone number before approval.";
    } else if (!input.skip && !message.trim()) {
      data.status = "invalid_contact";
      data.validationErrorCode = "missing_message";
      data.validationErrorMessage = "Add a WhatsApp message before approval.";
    } else if (!input.skip) {
      data.status = "generated";
      data.validationErrorCode = null;
      data.validationErrorMessage = null;
    }
  }

  const updated = await freelanceRepositories.bulkOutreachItems.update({
    where: { id: item.id },
    data
  });
  await freelanceRepositories.outreachEvents.create({
    data: {
      userId,
      batchId,
      itemId,
      leadId: item.leadId,
      campaignId: item.campaignId,
      channel: item.channel,
      stage: item.batch.stage,
      eventType: updated.status === "skipped" ? "skipped" : "item_updated",
      status: updated.status,
      recipient: updated.recipientEmail ?? updated.recipientWhatsapp ?? updated.recipientPhone,
      subject: updated.subject,
      payload: {
        status: updated.status,
        contactSource: updated.contactSource
      }
    }
  });
  const batch = await recomputeBulkOutreachBatchCounters(batchId);
  return { item: updated, batch };
}
