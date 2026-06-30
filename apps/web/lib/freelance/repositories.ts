import { prisma } from "@/lib/prisma";

export type OwnerScope = {
  userId: string;
};

export function requireOwnerScope(scope: OwnerScope) {
  if (!scope.userId) {
    throw new Error("Owner scope is required for Freelance data access.");
  }
  return scope;
}

export const freelanceRepositories = {
  niches: prisma.freelanceNiche,
  nicheCandidates: prisma.nicheCandidate,
  nicheAuditRuns: prisma.nicheAuditRun,
  nicheAuditFindings: prisma.nicheAuditFinding,
  campaigns: prisma.freelanceCampaign,
  jobs: prisma.prospectingJob,
  leads: prisma.freelanceLead,
  websiteAnalyses: prisma.websiteAnalysis,
  templates: prisma.commercialTemplate,
  settings: prisma.sellerSettings,
  generatedTexts: prisma.latestGeneratedText,
  bulkOutreachBatches: prisma.bulkOutreachBatch,
  bulkOutreachItems: prisma.bulkOutreachItem,
  outreachChannelSettings: prisma.outreachChannelSetting,
  outreachEvents: prisma.outreachEvent
};

export async function findOwnedFreelanceLeads(scope: OwnerScope, leadIds: string[]) {
  requireOwnerScope(scope);
  return prisma.freelanceLead.findMany({
    where: {
      userId: scope.userId,
      id: { in: leadIds }
    },
    include: {
      campaign: true,
      niche: true
    }
  });
}

export async function createOutreachEvent(input: Parameters<typeof prisma.outreachEvent.create>[0]) {
  return prisma.outreachEvent.create(input);
}

export async function recomputeBulkOutreachBatchCounters(batchId: string) {
  const items = await prisma.bulkOutreachItem.findMany({
    where: { batchId },
    select: { status: true }
  });

  const count = (statuses: string[]) =>
    items.filter((item) => statuses.includes(item.status)).length;

  return prisma.bulkOutreachBatch.update({
    where: { id: batchId },
    data: {
      selectedCount: items.length,
      eligibleCount: count(["queued", "generated", "approved", "sending", "sent", "failed_send"]),
      missingContactCount: count(["missing_contact"]),
      invalidContactCount: count(["invalid_contact"]),
      duplicateCount: count(["duplicate_blocked"]),
      generatedCount: count(["generated", "approved", "sending", "sent", "failed_send"]),
      failedCount: count(["generation_failed"]),
      skippedCount: count(["skipped"]),
      approvedCount: count(["approved", "sending", "sent", "failed_send"]),
      sentCount: count(["sent"]),
      failedSendCount: count(["failed_send"])
    }
  });
}
