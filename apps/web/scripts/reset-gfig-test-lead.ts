import { prisma } from "../lib/prisma";
import { normalizeOutreachPhone } from "../lib/freelance/phone-normalization";

const TEST_LEAD_NAME = "GFig Software Factory Sandbox";
const confirmed = process.argv.includes("--confirm");

async function main() {
  const matches = await prisma.freelanceLead.findMany({
    where: { businessName: TEST_LEAD_NAME },
    select: {
      id: true,
      userId: true,
      businessName: true,
      country: true,
      phone: true,
      whatsapp: true
    }
  });

  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one "${TEST_LEAD_NAME}" lead, found ${matches.length}. Nothing was changed.`
    );
  }

  const lead = matches[0];
  const [events, items, conversations, messages] = await Promise.all([
    prisma.outreachEvent.count({ where: { leadId: lead.id } }),
    prisma.bulkOutreachItem.count({ where: { leadId: lead.id } }),
    prisma.whatsAppConversation.count({ where: { leadId: lead.id } }),
    prisma.whatsAppMessage.count({ where: { leadId: lead.id } })
  ]);

  const preview = {
    event: "gfig_test_lead_reset_preview",
    leadId: lead.id,
    businessName: lead.businessName,
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    records: { events, items, conversations, messages }
  };

  if (!confirmed) {
    console.log(JSON.stringify({
      ...preview,
      changed: false,
      nextStep: "Run the same command with --confirm to delete this test history."
    }, null, 2));
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const itemRows = await tx.bulkOutreachItem.findMany({
      where: { leadId: lead.id },
      select: { id: true, batchId: true }
    });
    const eventRows = await tx.outreachEvent.findMany({
      where: { leadId: lead.id },
      select: { id: true }
    });
    const batchIds = Array.from(new Set(itemRows.map((item) => item.batchId)));
    const eventIds = eventRows.map((event) => event.id);

    if (eventIds.length) {
      await tx.bulkOutreachItem.updateMany({
        where: { duplicateOfEventId: { in: eventIds } },
        data: { duplicateOfEventId: null }
      });
    }

    const deletedConversations = await tx.whatsAppConversation.deleteMany({
      where: { leadId: lead.id }
    });
    const deletedEvents = await tx.outreachEvent.deleteMany({
      where: { leadId: lead.id }
    });
    const deletedItems = await tx.bulkOutreachItem.deleteMany({
      where: { leadId: lead.id }
    });
    const deletedBatches = batchIds.length
      ? await tx.bulkOutreachBatch.deleteMany({
          where: {
            id: { in: batchIds },
            items: { none: {} }
          }
        })
      : { count: 0 };

    const phone = normalizeOutreachPhone(lead.phone, lead.country);
    const whatsapp = normalizeOutreachPhone(lead.whatsapp, lead.country);
    const updatedLead = await tx.freelanceLead.update({
      where: { id: lead.id },
      data: {
        phone,
        whatsapp,
        commercialStatus: "new"
      },
      select: { id: true, phone: true, whatsapp: true, commercialStatus: true }
    });

    return {
      deleted: {
        events: deletedEvents.count,
        items: deletedItems.count,
        conversations: deletedConversations.count,
        messages,
        orphanBatches: deletedBatches.count
      },
      lead: updatedLead
    };
  });

  console.log(JSON.stringify({
    event: "gfig_test_lead_history_reset",
    businessName: lead.businessName,
    ...result
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
