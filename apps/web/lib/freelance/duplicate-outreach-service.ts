import type { OutreachChannel, TemplateStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { OwnerScope } from "./repositories";
import { requireOwnerScope } from "./repositories";

export type DuplicateOutreachLookup = {
  leadId: string;
  campaignId?: string | null;
  channel: OutreachChannel;
  stage?: TemplateStage;
};

export async function findDuplicateFirstContactOutreach(
  scope: OwnerScope,
  lookup: DuplicateOutreachLookup
) {
  requireOwnerScope(scope);
  return prisma.outreachEvent.findFirst({
    where: {
      userId: scope.userId,
      leadId: lookup.leadId,
      campaignId: lookup.campaignId ?? null,
      channel: lookup.channel,
      stage: lookup.stage ?? "first_contact",
      OR: [
        { eventType: "queued_send" },
        { eventType: "sent" },
        { status: { in: ["queued", "sending", "sent"] } }
      ]
    },
    orderBy: { occurredAt: "desc" }
  });
}
