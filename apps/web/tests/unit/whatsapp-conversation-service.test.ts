import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  isValidTwilioWebhookSignature,
  normalizeWhatsAppAddress
} from "@/lib/freelance/whatsapp-conversation-service";

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
      isValidTwilioWebhookSignature({
        url,
        params,
        authToken,
        signature: sign(url, params, authToken)
      })
    ).toBe(true);
    expect(
      isValidTwilioWebhookSignature({
        url,
        params,
        authToken,
        signature: "bad-signature"
      })
    ).toBe(false);
  });
});