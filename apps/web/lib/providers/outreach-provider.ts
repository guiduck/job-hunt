import type { OutreachChannel } from "@prisma/client";
import type { OutreachDiagnostic } from "./outreach-diagnostics";

export type ChannelReadiness = {
  channel: OutreachChannel;
  providerName: string;
  status:
    | "ready"
    | "missing_config"
    | "missing_credentials"
    | "not_approved"
    | "missing_template"
    | "missing_opt_in"
    | "rate_limited"
    | "provider_error"
    | "disabled";
  requiredEnvVars: string[];
  missingEnvVars: string[];
  dailyLimit?: number;
  remainingToday?: number;
  limitResetAt?: string;
  diagnosticCode?: string;
  diagnosticMessage?: string;
};

export type EmailSendInput = {
  to: string;
  subject: string;
  body: string;
  fromDisplayName?: string;
  fromAddress?: string;
  metadata: {
    userId: string;
    batchId: string;
    itemId: string;
    leadId: string;
  };
};

export type WhatsAppSendInput = {
  to: string;
  message: string;
  templateVariables?: Record<string, string>;
  templateName?: string;
  templateLanguage?: "pt-BR" | "en";
  metadata: {
    userId: string;
    batchId: string;
    itemId: string;
    leadId: string;
  };
};

export type DeliveryResult = {
  status: "sent" | "failed_send" | "blocked";
  providerName: string;
  providerMessageId?: string;
  providerStatus?: string;
  diagnosticCode?: string;
  diagnosticMessage?: string;
  retryAfter?: string;
  safePayload?: Record<string, unknown>;
};

export type EmailOutreachProvider = {
  channel: "email";
  getReadiness(): Promise<ChannelReadiness>;
  send(input: EmailSendInput): Promise<DeliveryResult>;
};

export type WhatsAppOutreachProvider = {
  channel: "whatsapp";
  getReadiness(): Promise<ChannelReadiness>;
  send(input: WhatsAppSendInput): Promise<DeliveryResult>;
};

export function blockedReadiness(input: {
  channel: OutreachChannel;
  providerName: string;
  dailyLimit?: number;
  diagnostic?: OutreachDiagnostic;
}): ChannelReadiness {
  return {
    channel: input.channel,
    providerName: input.providerName,
    status: input.diagnostic ? "missing_config" : "disabled",
    requiredEnvVars: [],
    missingEnvVars: input.diagnostic?.missingEnvVars ?? [],
    dailyLimit: input.dailyLimit,
    remainingToday: input.dailyLimit,
    diagnosticCode: input.diagnostic?.diagnosticCode,
    diagnosticMessage: input.diagnostic?.diagnosticMessage
  };
}

export function createBlockedEmailProvider(readiness: ChannelReadiness): EmailOutreachProvider {
  return {
    channel: "email",
    async getReadiness() {
      return readiness;
    },
    async send() {
      return {
        status: "blocked",
        providerName: readiness.providerName,
        diagnosticCode: readiness.diagnosticCode ?? "provider_not_configured",
        diagnosticMessage:
          readiness.diagnosticMessage ?? "Configure an email provider before sending email."
      };
    }
  };
}

export function createBlockedWhatsAppProvider(readiness: ChannelReadiness): WhatsAppOutreachProvider {
  return {
    channel: "whatsapp",
    async getReadiness() {
      return readiness;
    },
    async send() {
      return {
        status: "blocked",
        providerName: readiness.providerName,
        diagnosticCode: readiness.diagnosticCode ?? "provider_not_configured",
        diagnosticMessage:
          readiness.diagnosticMessage ??
          "Configure a WhatsApp provider before sending WhatsApp messages."
      };
    }
  };
}
