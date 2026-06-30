import type { OutreachChannel } from "@prisma/client";
import { getEmailChannelConfig, type ChannelRuntimeConfig } from "@/lib/config";
import { buildMissingEnvDiagnostic } from "./outreach-diagnostics";
import {
  blockedReadiness,
  createBlockedEmailProvider,
  type ChannelReadiness,
  type EmailOutreachProvider
} from "./outreach-provider";
import { createResendEmailProvider } from "./resend-email-provider";

function readinessFromConfig(config: ChannelRuntimeConfig): ChannelReadiness {
  const channel: OutreachChannel = "email";
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
    diagnosticMessage: "Email provider is configured and ready."
  };
}

export function getEmailReadiness(env: Record<string, string | undefined> = process.env) {
  return readinessFromConfig(getEmailChannelConfig(env));
}

export function createEmailProvider(
  env: Record<string, string | undefined> = process.env
): EmailOutreachProvider {
  const config = getEmailChannelConfig(env);
  const readiness = readinessFromConfig(config);
  if (readiness.status !== "ready") {
    return createBlockedEmailProvider(readiness);
  }

  if (config.providerName === "resend") {
    return createResendEmailProvider({
      apiKey: env.RESEND_API_KEY ?? "",
      from: config.displayAddress ?? "",
      dailyLimit: config.dailyLimit,
      readiness
    });
  }

  return createBlockedEmailProvider({
    ...readiness,
    status: "provider_error",
    diagnosticCode: "unsupported_email_provider",
    diagnosticMessage: `Email provider ${config.providerName} is not supported by apps/web yet.`
  });
}
