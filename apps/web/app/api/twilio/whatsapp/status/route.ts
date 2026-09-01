import { NextResponse } from "next/server";
import { recordTwilioWhatsAppStatus } from "@/lib/freelance/whatsapp-conversation-service";
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
    console.error("Rejected Twilio WhatsApp status signature", {
      candidates: validation.candidates,
      hasSignature: Boolean(request.headers.get("x-twilio-signature")),
      hasAuthToken: Boolean(process.env.TWILIO_AUTH_TOKEN),
      messageSid: params.MessageSid ?? params.SmsMessageSid ?? null
    });
    return NextResponse.json({ error: "Invalid Twilio signature." }, { status: 403 });
  }

  try {
    await recordTwilioWhatsAppStatus(params);
  } catch (error) {
    console.error("Unable to record WhatsApp delivery status", error);
    return NextResponse.json({ error: "Unable to record WhatsApp delivery status." }, { status: 400 });
  }

  return new Response(null, { status: 200 });
}
