import { prisma } from "../lib/prisma";
import { recordOutboundWhatsAppMessage } from "../lib/freelance/whatsapp-conversation-service";

type TwilioMessageResponse = {
  status?: string;
  error_code?: number | null;
  error_message?: string | null;
};

async function fetchTwilioStatus(messageSid: string): Promise<TwilioMessageResponse | null> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;

  const response = await fetch(
    "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages/" + messageSid + ".json",
    {
      headers: {
        Authorization: "Basic " + Buffer.from(accountSid + ":" + authToken).toString("base64")
      }
    }
  );
  if (!response.ok) {
    console.warn("Unable to fetch Twilio status for " + messageSid + ": HTTP " + response.status);
    return null;
  }
  return response.json() as Promise<TwilioMessageResponse>;
}

async function main() {
  const items = await prisma.bulkOutreachItem.findMany({
    where: {
      channel: "whatsapp",
      providerName: "twilio",
      providerMessageId: { not: null },
      message: { not: null },
      status: "sent"
    },
    orderBy: { createdAt: "asc" }
  });

  let imported = 0;
  for (const item of items) {
    const providerMessageId = item.providerMessageId;
    const body = item.message;
    if (!providerMessageId || !body) continue;

    const twilio = await fetchTwilioStatus(providerMessageId);
    const providerStatus = twilio?.status ?? item.providerStatus ?? "sent";
    const failed = providerStatus === "failed" || providerStatus === "undelivered";
    await prisma.bulkOutreachItem.update({
      where: { id: item.id },
      data: {
        status: failed ? "failed_send" : item.status,
        providerStatus,
        providerErrorCode: failed ? String(twilio?.error_code ?? "twilio_delivery_failed") : null,
        providerErrorMessage: failed ? twilio?.error_message ?? "Twilio reported delivery failure." : null
      }
    });
    if (failed) continue;

    const message = await recordOutboundWhatsAppMessage({
      userId: item.userId,
      leadId: item.leadId,
      to: item.recipientWhatsapp ?? item.recipientPhone ?? "",
      from: process.env.TWILIO_WHATSAPP_FROM ?? "",
      body,
      providerMessageId,
      providerStatus,
      payload: twilio ?? {}
    });
    if (message) imported += 1;
  }

  console.log(JSON.stringify({
    event: "whatsapp_inbox_backfill_complete",
    candidates: items.length,
    imported
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
