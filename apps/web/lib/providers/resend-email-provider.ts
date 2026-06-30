import { scrubProviderPayload } from "./outreach-diagnostics";
import type {
  ChannelReadiness,
  DeliveryResult,
  EmailOutreachProvider,
  EmailSendInput
} from "./outreach-provider";

type ResendEmailProviderOptions = {
  apiKey: string;
  from: string;
  dailyLimit: number;
  readiness: ChannelReadiness;
  fetchImpl?: typeof fetch;
};

function normalizeResendFailure(status: number, payload: Record<string, unknown>): DeliveryResult {
  const code =
    status === 429 ? "provider_rate_limited" : String(payload.name ?? payload.code ?? "provider_error");
  const message =
    status === 429
      ? "The email provider rate limit was reached. Try again after the reset time."
      : String(payload.message ?? "The email provider rejected this delivery request.");

  return {
    status: status === 429 ? "blocked" : "failed_send",
    providerName: "resend",
    providerStatus: String(status),
    diagnosticCode: code,
    diagnosticMessage: message,
    safePayload: scrubProviderPayload(payload)
  };
}

export function createResendEmailProvider(options: ResendEmailProviderOptions): EmailOutreachProvider {
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    channel: "email",
    async getReadiness() {
      return {
        ...options.readiness,
        dailyLimit: options.dailyLimit,
        remainingToday: options.readiness.remainingToday ?? options.dailyLimit
      };
    },
    async send(input: EmailSendInput) {
      try {
        const response = await fetchImpl("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: input.fromAddress ?? options.from,
            to: [input.to],
            subject: input.subject,
            text: input.body,
            tags: [
              { name: "batchId", value: input.metadata.batchId },
              { name: "itemId", value: input.metadata.itemId },
              { name: "leadId", value: input.metadata.leadId }
            ]
          })
        });
        const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        if (!response.ok) {
          return normalizeResendFailure(response.status, payload);
        }

        return {
          status: "sent",
          providerName: "resend",
          providerMessageId: typeof payload.id === "string" ? payload.id : undefined,
          providerStatus: String(response.status),
          safePayload: scrubProviderPayload(payload)
        };
      } catch (error) {
        return {
          status: "failed_send",
          providerName: "resend",
          diagnosticCode: "provider_network_error",
          diagnosticMessage:
            error instanceof Error ? error.message : "Unable to reach the email provider."
        };
      }
    }
  };
}
