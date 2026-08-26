import { describe, expect, it, vi } from "vitest";
import { createWhatsAppProvider, getWhatsAppReadiness } from "@/lib/providers/whatsapp-provider";
import { createTwilioWhatsAppProvider } from "@/lib/providers/twilio-whatsapp-provider";

describe("whatsapp provider", () => {
  it("reports required Twilio env vars without secret values", () => {
    const readiness = getWhatsAppReadiness({
      FREELANCE_WHATSAPP_PROVIDER: "twilio",
      FREELANCE_WHATSAPP_DAILY_LIMIT: "500",
      TWILIO_ACCOUNT_SID: "AC123"
    });

    expect(readiness.status).toBe("missing_config");
    expect(readiness.missingEnvVars).toEqual(["TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM"]);
    expect(JSON.stringify(readiness)).not.toContain("AC123");
  });

  it("reports ready Twilio capacity when configured", async () => {
    const provider = createWhatsAppProvider({
      FREELANCE_WHATSAPP_PROVIDER: "twilio",
      FREELANCE_WHATSAPP_DAILY_LIMIT: "500",
      TWILIO_ACCOUNT_SID: "AC123",
      TWILIO_AUTH_TOKEN: "secret-token",
      TWILIO_WHATSAPP_FROM: "+15555550000"
    });

    await expect(provider.getReadiness()).resolves.toMatchObject({
      status: "ready",
      providerName: "twilio",
      dailyLimit: 500,
      remainingToday: 500
    });
  });

  it("normalizes Twilio success and opt-in/template-like failures safely", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sid: "SM123", status: "queued" }), { status: 201 })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: 63016,
            message: "Failed to send freeform message because of a WhatsApp rule.",
            authToken: "secret-token"
          }),
          { status: 400 }
        )
      );
    const provider = createTwilioWhatsAppProvider({
      accountSid: "AC123",
      authToken: "secret-token",
      from: "+15555550000",
      dailyLimit: 500,
      readiness: {
        channel: "whatsapp",
        providerName: "twilio",
        status: "ready",
        requiredEnvVars: [],
        missingEnvVars: []
      },
      fetchImpl
    });

    await expect(
      provider.send({
        to: "+15555550123",
        message: "Hello",
        metadata: { userId: "user_1", batchId: "batch_1", itemId: "item_1", leadId: "lead_1" }
      })
    ).resolves.toMatchObject({
      status: "sent",
      providerMessageId: "SM123",
      providerStatus: "queued",
      diagnosticCode: "twilio_delivery_pending"
    });
    await expect(
      provider.send({
        to: "+15555550123",
        message: "Hello",
        metadata: { userId: "user_1", batchId: "batch_1", itemId: "item_1", leadId: "lead_1" }
      })
    ).resolves.toMatchObject({
      status: "failed_send",
      diagnosticCode: "63016",
      safePayload: {
        code: 63016,
        message: "Failed to send freeform message because of a WhatsApp rule."
      }
    });
  });
  it("sends approved WhatsApp templates with ContentSid and ContentVariables", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ sid: "SM_TEMPLATE", status: "queued" }), { status: 201 })
    );
    const provider = createTwilioWhatsAppProvider({
      accountSid: "AC123",
      authToken: "secret-token",
      from: "+15555550000",
      templateContentSid: "HX123",
      dailyLimit: 500,
      readiness: {
        channel: "whatsapp",
        providerName: "twilio",
        status: "ready",
        requiredEnvVars: [],
        missingEnvVars: []
      },
      fetchImpl
    });

    await provider.send({
      to: "+15555550123",
      message: "Preview only",
      templateVariables: { "1": "pessoal", "2": "Guilherme" },
      metadata: { userId: "user_1", batchId: "batch_1", itemId: "item_1", leadId: "lead_1" }
    });

    const request = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    const body = request.body as URLSearchParams;
    expect(body.get("ContentSid")).toBe("HX123");
    expect(body.get("ContentVariables")).toBe(JSON.stringify({ "1": "pessoal", "2": "Guilherme" }));
    expect(body.has("Body")).toBe(false);
  });

  it("selects the English ContentSid for English WhatsApp templates", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ sid: "SM_TEMPLATE_EN", status: "queued" }), { status: 201 })
    );
    const provider = createTwilioWhatsAppProvider({
      accountSid: "AC123",
      authToken: "secret-token",
      from: "+15555550000",
      templateContentSid: "HX_PT",
      templateContentSidEn: "HX_EN",
      dailyLimit: 500,
      readiness: {
        channel: "whatsapp",
        providerName: "twilio",
        status: "ready",
        requiredEnvVars: [],
        missingEnvVars: []
      },
      fetchImpl
    });

    await provider.send({
      to: "+15555550123",
      message: "Preview only",
      templateLanguage: "en",
      templateVariables: { "1": "there", "2": "Guilherme" },
      metadata: { userId: "user_1", batchId: "batch_1", itemId: "item_1", leadId: "lead_1" }
    });

    const request = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    const body = request.body as URLSearchParams;
    expect(body.get("ContentSid")).toBe("HX_EN");
    expect(body.get("ContentVariables")).toBe(JSON.stringify({ "1": "there", "2": "Guilherme" }));
    expect(body.has("Body")).toBe(false);
  });
  it("blocks empty or multiline template variables before calling Twilio", async () => {
    const fetchImpl = vi.fn();
    const provider = createTwilioWhatsAppProvider({
      accountSid: "AC123",
      authToken: "secret-token",
      from: "+15555550000",
      templateContentSid: "HX_PT",
      dailyLimit: 500,
      readiness: {
        channel: "whatsapp",
        providerName: "twilio",
        status: "ready",
        requiredEnvVars: [],
        missingEnvVars: []
      },
      fetchImpl
    });

    await expect(
      provider.send({
        to: "+15555550123",
        message: "Preview only",
        templateVariables: { "1": "pessoal", "2": "" },
        metadata: { userId: "user_1", batchId: "batch_1", itemId: "item_1", leadId: "lead_1" }
      })
    ).resolves.toMatchObject({
      status: "failed_send",
      diagnosticCode: "invalid_content_variables"
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("does not use the Portuguese SID for an English first contact", async () => {
    const fetchImpl = vi.fn();
    const provider = createTwilioWhatsAppProvider({
      accountSid: "AC123",
      authToken: "secret-token",
      from: "+15555550000",
      templateContentSid: "HX_PT",
      dailyLimit: 500,
      readiness: {
        channel: "whatsapp",
        providerName: "twilio",
        status: "ready",
        requiredEnvVars: [],
        missingEnvVars: []
      },
      fetchImpl
    });

    await expect(
      provider.send({
        to: "+15555550123",
        message: "Preview only",
        templateLanguage: "en",
        templateVariables: { "1": "there" },
        metadata: { userId: "user_1", batchId: "batch_1", itemId: "item_1", leadId: "lead_1" }
      })
    ).resolves.toMatchObject({
      status: "failed_send",
      diagnosticCode: "missing_whatsapp_template_sid"
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

});
