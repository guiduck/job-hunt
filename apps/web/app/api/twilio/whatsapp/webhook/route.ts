import { NextResponse } from "next/server";
import { recordInboundTwilioWhatsAppMessage } from "@/lib/freelance/whatsapp-conversation-service";
import { validateTwilioWebhookRequest } from "@/lib/freelance/twilio-webhook-security";

export async function POST(request: Request) {
  const formData = await request.formData();
  const params = Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)])
  );

  const validation = validateTwilioWebhookRequest({
    request,
    params,
    authToken: process.env.TWILIO_AUTH_TOKEN
  });

  if (!validation.valid) {
    console.error("Rejected Twilio WhatsApp webhook signature", {
      candidates: validation.candidates,
      hasSignature: Boolean(request.headers.get("x-twilio-signature")),
      hasAuthToken: Boolean(process.env.TWILIO_AUTH_TOKEN),
      messageSid: params.MessageSid ?? params.SmsMessageSid ?? null
    });
    return NextResponse.json({ error: "Invalid Twilio signature." }, { status: 403 });
  }

  try {
    const message = await recordInboundTwilioWhatsAppMessage(params);
    console.info("Recorded inbound Twilio WhatsApp message", {
      providerMessageId: message.providerMessageId,
      conversationId: message.conversationId,
      validatedUrl: validation.validatedUrl
    });
  } catch (error) {
    console.error("Unable to record inbound WhatsApp message", error);
    return NextResponse.json({ error: "Unable to record inbound WhatsApp message." }, { status: 400 });
  }

  return new Response("<Response></Response>", {
    headers: { "Content-Type": "text/xml" }
  });
}
