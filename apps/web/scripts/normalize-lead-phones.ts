import { prisma } from "../lib/prisma";
import { normalizeOutreachPhone } from "../lib/freelance/phone-normalization";

async function main() {
  const leads = await prisma.freelanceLead.findMany({
    select: { id: true, country: true, phone: true, whatsapp: true }
  });

  let updated = 0;
  for (const lead of leads) {
    const phone = normalizeOutreachPhone(lead.phone, lead.country);
    const whatsapp = normalizeOutreachPhone(lead.whatsapp, lead.country);
    if (phone === lead.phone && whatsapp === lead.whatsapp) continue;

    await prisma.freelanceLead.update({
      where: { id: lead.id },
      data: { phone, whatsapp }
    });
    updated += 1;
  }

  console.log(JSON.stringify({
    event: "lead_phone_normalization_complete",
    inspected: leads.length,
    updated
  }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
