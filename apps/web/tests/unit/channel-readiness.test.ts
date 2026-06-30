import { describe, expect, it } from "vitest";
import { getEmailChannelConfig, getWhatsappChannelConfig } from "@/lib/config";
import {
  buildMissingEnvDiagnostic,
  scrubProviderPayload
} from "@/lib/providers/outreach-diagnostics";
import {
  blockedReadiness,
  createBlockedEmailProvider,
  createBlockedWhatsAppProvider
} from "@/lib/providers/outreach-provider";

describe("channel readiness diagnostics", () => {
  it("reports missing env var names without values", () => {
    const readiness = getEmailChannelConfig({
      FREELANCE_EMAIL_PROVIDER: "resend",
      FREELANCE_EMAIL_DAILY_LIMIT: "500",
      FREELANCE_EMAIL_FROM: "hello@example.com"
    });

    expect(readiness.requiredEnvVars).toContain("RESEND_API_KEY");
    expect(readiness.missingEnvVars).toEqual(["RESEND_API_KEY"]);
    expect(JSON.stringify(readiness)).not.toContain("secret-value");
  });

  it("builds WhatsApp missing env diagnostics", () => {
    const config = getWhatsappChannelConfig({
      FREELANCE_WHATSAPP_PROVIDER: "twilio",
      FREELANCE_WHATSAPP_DAILY_LIMIT: "500"
    });
    const diagnostic = buildMissingEnvDiagnostic({
      channel: "whatsapp",
      providerName: config.providerName,
      missingEnvVars: config.missingEnvVars
    });

    expect(diagnostic.diagnosticCode).toBe("missing_env");
    expect(diagnostic.diagnosticMessage).toContain("TWILIO_ACCOUNT_SID");
  });

  it("scrubs provider payloads and blocks null providers", async () => {
    expect(
      scrubProviderPayload({
        providerMessageId: "msg_1",
        authorization: "Bearer secret",
        apiKey: "secret"
      })
    ).toEqual({ providerMessageId: "msg_1" });

    const emailReadiness = blockedReadiness({
      channel: "email",
      providerName: "resend",
      diagnostic: buildMissingEnvDiagnostic({
        channel: "email",
        providerName: "resend",
        missingEnvVars: ["RESEND_API_KEY"]
      })
    });
    expect((await createBlockedEmailProvider(emailReadiness).send({} as never)).status).toBe(
      "blocked"
    );
    expect(
      (await createBlockedWhatsAppProvider({
        channel: "whatsapp",
        providerName: "twilio",
        status: "disabled",
        requiredEnvVars: [],
        missingEnvVars: []
      }).send({} as never)).status
    ).toBe("blocked");
  });
});
