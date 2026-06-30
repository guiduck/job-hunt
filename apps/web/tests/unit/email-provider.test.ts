import { describe, expect, it, vi } from "vitest";
import { createEmailProvider, getEmailReadiness } from "@/lib/providers/email-provider";
import { createResendEmailProvider } from "@/lib/providers/resend-email-provider";

describe("email provider", () => {
  it("reports missing env vars by name without leaking values", () => {
    const readiness = getEmailReadiness({
      FREELANCE_EMAIL_PROVIDER: "resend",
      FREELANCE_EMAIL_DAILY_LIMIT: "500",
      FREELANCE_EMAIL_FROM: "hello@example.com"
    });

    expect(readiness.status).toBe("missing_config");
    expect(readiness.missingEnvVars).toEqual(["RESEND_API_KEY"]);
    expect(JSON.stringify(readiness)).not.toContain("secret");
  });

  it("reports ready capacity from configured env", async () => {
    const provider = createEmailProvider({
      FREELANCE_EMAIL_PROVIDER: "resend",
      FREELANCE_EMAIL_DAILY_LIMIT: "500",
      FREELANCE_EMAIL_FROM: "hello@example.com",
      RESEND_API_KEY: "secret-key"
    });

    await expect(provider.getReadiness()).resolves.toMatchObject({
      status: "ready",
      providerName: "resend",
      dailyLimit: 500,
      remainingToday: 500
    });
  });

  it("normalizes Resend send success and failure without auth headers", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "email_1" }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            name: "rate_limit_exceeded",
            message: "Too many requests",
            apiKey: "secret-key"
          }),
          { status: 429 }
        )
      );
    const provider = createResendEmailProvider({
      apiKey: "secret-key",
      from: "hello@example.com",
      dailyLimit: 500,
      readiness: {
        channel: "email",
        providerName: "resend",
        status: "ready",
        requiredEnvVars: [],
        missingEnvVars: []
      },
      fetchImpl
    });

    await expect(
      provider.send({
        to: "owner@example.com",
        subject: "Quick idea",
        body: "Hello",
        metadata: { userId: "user_1", batchId: "batch_1", itemId: "item_1", leadId: "lead_1" }
      })
    ).resolves.toMatchObject({ status: "sent", providerMessageId: "email_1" });
    await expect(
      provider.send({
        to: "owner@example.com",
        subject: "Quick idea",
        body: "Hello",
        metadata: { userId: "user_1", batchId: "batch_1", itemId: "item_1", leadId: "lead_1" }
      })
    ).resolves.toMatchObject({
      status: "blocked",
      diagnosticCode: "provider_rate_limited",
      safePayload: { name: "rate_limit_exceeded", message: "Too many requests" }
    });
  });
});
