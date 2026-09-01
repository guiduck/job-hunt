import type { OutreachChannel } from "@prisma/client";
import { getWhatsappChannelConfig, type ChannelRuntimeConfig } from "@/lib/config";
import { buildMissingEnvDiagnostic } from "./outreach-diagnostics";
import {
  blockedReadiness,
  createBlockedWhatsAppProvider,
  type ChannelReadiness,
  type WhatsAppOutreachProvider
} from "./outreach-provider";
import { createTwilioWhatsAppProvider } from "./twilio-whatsapp-provider";

function readinessFromConfig(config: ChannelRuntimeConfig): ChannelReadiness {
  const channel: OutreachChannel = "whatsapp";
  if (config.missingEnvVars.length > 0) {
    const diagnostic = buildMissingEnvDiagnostic({
      channel,
      providerName: config.providerName,
      missingEnvVars: config.missingEnvVars
    });
    return {
      ...blockedReadiness({
        channel,
        providerName: config.providerName,
        dailyLimit: config.dailyLimit,
        diagnostic
      }),
      requiredEnvVars: config.requiredEnvVars,
      remainingToday: config.dailyLimit
    };
  }

  return {
    channel,
    providerName: config.providerName,
    status: "ready",
    requiredEnvVars: config.requiredEnvVars,
    missingEnvVars: [],
    dailyLimit: config.dailyLimit,
    remainingToday: config.dailyLimit,
    diagnosticCode: "ready",
    diagnosticMessage: "WhatsApp provider is configured and ready."
  };
}

export function getWhatsAppReadiness(env: Record<string, string | undefined> = process.env) {
  return readinessFromConfig(getWhatsappChannelConfig(env));
}

export function createWhatsAppProvider(
  env: Record<string, string | undefined> = process.env
): WhatsAppOutreachProvider {
  const config = getWhatsappChannelConfig(env);
  const readiness = readinessFromConfig(config);
  if (readiness.status !== "ready") {
    return createBlockedWhatsAppProvider(readiness);
  }

  if (config.providerName === "twilio") {
    return createTwilioWhatsAppProvider({
      accountSid: env.TWILIO_ACCOUNT_SID ?? "",
      authToken: env.TWILIO_AUTH_TOKEN ?? "",
      from: config.displayAddress ?? "",
      templateContentSid: config.templateContentSid,
      templateContentSidEn: config.templateContentSidEn,
      templateContentSidV2: config.templateContentSidV2,
      templateContentSidEnV2: config.templateContentSidEnV2,
      dailyLimit: config.dailyLimit,
      readiness
    });
  }

  return createBlockedWhatsAppProvider({
    ...readiness,
    status: "provider_error",
    diagnosticCode: "unsupported_whatsapp_provider",
    diagnosticMessage: `WhatsApp provider ${config.providerName} is not supported by apps/web yet.`
  });
}
