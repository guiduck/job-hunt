import type { OutreachChannel, OutreachEvent, TemplateStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { OwnerScope } from "./repositories";
import { requireOwnerScope } from "./repositories";

export type DuplicateOutreachLookup = {
  leadId: string;
  campaignId?: string | null;
  channel: OutreachChannel;
  stage?: TemplateStage;
  recipient?: string | null;
};

function isBlockingOutreachEvent(event: OutreachEvent) {
  return event.eventType === "sent" && event.status === "sent";
}

export async function findDuplicateFirstContactOutreach(
  scope: OwnerScope,
  lookup: DuplicateOutreachLookup
) {
  requireOwnerScope(scope);
  const events = await prisma.outreachEvent.findMany({
    where: {
      userId: scope.userId,
      leadId: lookup.leadId,
      campaignId: lookup.campaignId ?? null,
      channel: lookup.channel,
      stage: lookup.stage ?? "first_contact",
      eventType: "sent",
      status: "sent"
    },
    orderBy: { occurredAt: "desc" },
    take: 5
  });
  const latestRelevantEvent = lookup.recipient
    ? events.find((event) => event.recipient === lookup.recipient)
    : events[0];
  return latestRelevantEvent && isBlockingOutreachEvent(latestRelevantEvent)
    ? latestRelevantEvent
    : null;
}
