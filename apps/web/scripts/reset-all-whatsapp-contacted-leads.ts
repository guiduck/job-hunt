import { prisma } from "../lib/prisma";

const confirmed = process.argv.includes("--confirm-all");

async function main() {
  const blockingEvents = await prisma.outreachEvent.findMany({
    where: {
      channel: "whatsapp",
      stage: "first_contact",
      eventType: "sent",
      status: "sent"
    },
    select: {
      id: true,
      leadId: true,
      recipient: true,
      occurredAt: true,
      lead: {
        select: {
          businessName: true
        }
      }
    },
    orderBy: { occurredAt: "asc" }
  });

  const eventIds = blockingEvents.map((event) => event.id);
  const affectedLeads = Array.from(
    new Map(
      blockingEvents.map((event) => [
        event.leadId,
        {
          leadId: event.leadId,
          businessName: event.lead.businessName
        }
      ])
    ).values()
  );
  const linkedDuplicateItems = eventIds.length
    ? await prisma.bulkOutreachItem.count({
        where: { duplicateOfEventId: { in: eventIds } }
      })
    : 0;

  const preview = {
    event: "all_whatsapp_contacted_leads_reset_preview",
    changed: false,
    blockingEvents: blockingEvents.length,
    affectedLeads: affectedLeads.length,
    linkedDuplicateItems,
    leads: affectedLeads
  };

  if (!confirmed) {
    console.log(JSON.stringify({
      ...preview,
      nextStep:
        "Run the same command with --confirm-all to clear the WhatsApp first-contact duplicate history."
    }, null, 2));
    return;
  }

  if (!eventIds.length) {
    console.log(JSON.stringify({
      event: "all_whatsapp_contacted_leads_reset",
      changed: false,
      blockingEventsDeleted: 0,
      affectedLeads: 0,
      duplicateItemsReleased: 0
    }, null, 2));
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const duplicateItemsReleased = await tx.bulkOutreachItem.updateMany({
      where: {
        duplicateOfEventId: { in: eventIds },
        status: "duplicate_blocked"
      },
      data: {
        status: "queued",
        duplicateOfEventId: null,
        validationErrorCode: null,
        validationErrorMessage: null
      }
    });

    await tx.bulkOutreachItem.updateMany({
      where: { duplicateOfEventId: { in: eventIds } },
      data: { duplicateOfEventId: null }
    });

    const deletedEvents = await tx.outreachEvent.deleteMany({
      where: { id: { in: eventIds } }
    });

    return {
      blockingEventsDeleted: deletedEvents.count,
      duplicateItemsReleased: duplicateItemsReleased.count
    };
  });

  console.log(JSON.stringify({
    event: "all_whatsapp_contacted_leads_reset",
    changed: true,
    affectedLeads: affectedLeads.length,
    ...result,
    preserved: {
      inboxConversations: true,
      inboxMessages: true,
      twilioLogs: true,
      leads: true
    }
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
