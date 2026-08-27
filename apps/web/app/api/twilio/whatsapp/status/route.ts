import { NextResponse } from "next/server";
import {
  isValidTwilioWebhookSignature,
  recordTwilioWhatsAppStatus
} from "@/lib/freelance/whatsapp-conversation-service";

export async function POST(request: Request) {
  const formData = await request.formData();
  const params = Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)])
  );

  const isValid = isValidTwilioWebhookSignature({
    url: request.url,
    params,
    signature: request.headers.get("x-twilio-signature"),
    authToken: process.env.TWILIO_AUTH_TOKEN
  });

  if (!isValid) {
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
