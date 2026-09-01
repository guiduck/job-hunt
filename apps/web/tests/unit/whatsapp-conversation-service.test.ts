import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  normalizeTwilioMessageStatus,
  normalizeWhatsAppAddress,
  shouldApplyTwilioMessageStatus
} from "@/lib/freelance/whatsapp-conversation-service";
import {
  getTwilioWebhookUrlCandidates,
  validateTwilioWebhookRequest
} from "@/lib/freelance/twilio-webhook-security";

function sign(url: string, params: Record<string, string>, token: string) {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("");
  return crypto.createHmac("sha1", token).update(`${url}${sorted}`).digest("base64");
}

describe("whatsapp conversation service", () => {
  it("normalizes Twilio WhatsApp addresses to E.164 phone numbers", () => {
    expect(normalizeWhatsAppAddress("whatsapp:+55 61 9 9913-6993")).toBe("+5561999136993");
    expect(normalizeWhatsAppAddress("5561999136993")).toBe("+5561999136993");
  });

  it("normalizes final Twilio delivery statuses", () => {
    expect(normalizeTwilioMessageStatus("DELIVERED")).toBe("delivered");
    expect(normalizeTwilioMessageStatus("undelivered")).toBe("undelivered");
    expect(normalizeTwilioMessageStatus("unexpected")).toBe("unknown");
    expect(shouldApplyTwilioMessageStatus("queued", "delivered")).toBe(true);
    expect(shouldApplyTwilioMessageStatus("delivered", "sent")).toBe(false);
    expect(shouldApplyTwilioMessageStatus("read", "delivered")).toBe(false);
  });

  it("validates Twilio webhook signatures from url and sorted form params", () => {
    const url = "https://example.com/api/twilio/whatsapp/webhook";
    const params = {
      Body: "Oi",
      From: "whatsapp:+5561999136993",
      MessageSid: "SM123",
      To: "whatsapp:+5561999999999"
    };
    const authToken = "secret-token";

    expect(
      validateTwilioWebhookRequest({
        request: new Request(url, {
          headers: { "x-twilio-signature": sign(url, params, authToken) }
        }),
        params,
        authToken
      }).valid
    ).toBe(true);
    expect(
      validateTwilioWebhookRequest({
        request: new Request(url, {
          headers: { "x-twilio-signature": "bad-signature" }
        }),
        params,
        authToken
      }).valid
    ).toBe(false);
  });

  it("validates against the configured public URL behind a reverse proxy", () => {
    const previousBase = process.env.TWILIO_WEBHOOK_BASE_URL;
    process.env.TWILIO_WEBHOOK_BASE_URL = "https://freelance.gfig.space";
    const publicUrl = "https://freelance.gfig.space/api/twilio/whatsapp/webhook";
    const params = {
      Body: "Resposta",
      From: "whatsapp:+5561982724656",
      MessageSid: "SM_PROXY",
      To: "whatsapp:+556199136993"
    };
    const authToken = "proxy-token";
    const request = new Request(
      "http://127.0.0.1:3000/api/twilio/whatsapp/webhook",
      {
        headers: {
          "x-forwarded-host": "freelance.gfig.space",
          "x-forwarded-proto": "https",
          "x-twilio-signature": sign(publicUrl, params, authToken)
        }
      }
    );

    expect(getTwilioWebhookUrlCandidates(request)).toContain(publicUrl);
    expect(validateTwilioWebhookRequest({ request, params, authToken })).toMatchObject({
      valid: true,
      validatedUrl: publicUrl
    });

    if (previousBase === undefined) delete process.env.TWILIO_WEBHOOK_BASE_URL;
    else process.env.TWILIO_WEBHOOK_BASE_URL = previousBase;
  });

});
