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
  if (event.eventType === "failed_send" || event.status === "failed_send") {
    return false;
  }
  return (
    event.eventType === "queued_send" ||
    event.eventType === "sent" ||
    ["queued", "sending", "sent"].includes(event.status)
  );
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
      OR: [
        { eventType: { in: ["queued_send", "sent", "failed_send"] } },
        { status: { in: ["queued", "sending", "sent", "failed_send"] } }
      ]
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
