import type { OutreachChannel } from "@prisma/client";

const SECRET_KEY_PATTERN = /(secret|token|password|authorization|api[_-]?key|auth[_-]?token|client[_-]?secret)/i;

export type OutreachDiagnostic = {
  channel: OutreachChannel;
  providerName?: string;
  diagnosticCode: string;
  diagnosticMessage: string;
  missingEnvVars?: string[];
  safePayload?: Record<string, unknown>;
};

export function scrubProviderPayload(payload: Record<string, unknown> = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => !SECRET_KEY_PATTERN.test(key))
  );
}

export function buildMissingEnvDiagnostic(input: {
  channel: OutreachChannel;
  providerName?: string;
  missingEnvVars: string[];
}): OutreachDiagnostic {
  const noun = input.channel === "whatsapp" ? "WhatsApp messages" : "email";
  return {
    channel: input.channel,
    providerName: input.providerName,
    diagnosticCode: "missing_env",
    diagnosticMessage: `Configure ${input.missingEnvVars.join(" and ")} before sending ${noun}.`,
    missingEnvVars: input.missingEnvVars
  };
}
