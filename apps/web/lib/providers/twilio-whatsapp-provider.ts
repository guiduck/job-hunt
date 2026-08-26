import { scrubProviderPayload } from "./outreach-diagnostics";
import type {
  ChannelReadiness,
  DeliveryResult,
  WhatsAppOutreachProvider,
  WhatsAppSendInput
} from "./outreach-provider";

type TwilioWhatsAppProviderOptions = {
  accountSid: string;
  authToken: string;
  from: string;
  templateContentSid?: string;
  templateContentSidEn?: string;
  dailyLimit: number;
  readiness: ChannelReadiness;
  fetchImpl?: typeof fetch;
};

function withWhatsappPrefix(value: string) {
  return value.startsWith("whatsapp:") ? value : `whatsapp:${value}`;
}

function selectTemplateContentSid(options: TwilioWhatsAppProviderOptions, input: WhatsAppSendInput) {
  if (input.templateLanguage === "en") {
    return options.templateContentSidEn;
  }

  return options.templateContentSid;
}

function invalidTemplateVariables(variables: Record<string, string>) {
  const invalidKeys = Object.entries(variables)
    .filter(([, value]) => !value.trim() || /[\r\n]/.test(value))
    .map(([key]) => key);

  return invalidKeys.length > 0 ? invalidKeys : undefined;
}

function twilioAcceptedDiagnostic(providerStatus: string) {
  if (["delivered"].includes(providerStatus.toLowerCase())) {
    return {};
  }

  return {
    diagnosticCode: "twilio_delivery_pending",
    diagnosticMessage: `Twilio accepted the WhatsApp message with provider status ${providerStatus}. Delivery can still fail asynchronously; check the Twilio message log or configure a status callback to confirm final delivery.`
  };
}

function normalizeTwilioFailure(status: number, payload: Record<string, unknown>): DeliveryResult {
  const code = String(payload.code ?? (status === 429 ? "provider_rate_limited" : "provider_error"));
  const message =
    status === 429
      ? "The WhatsApp provider rate limit was reached. Try again after the reset time."
      : String(payload.message ?? "The WhatsApp provider rejected this delivery request.");

  return {
    status: status === 429 ? "blocked" : "failed_send",
    providerName: "twilio",
    providerStatus: String(status),
    diagnosticCode: code,
    diagnosticMessage: message,
    safePayload: scrubProviderPayload(payload)
  };
}

export function createTwilioWhatsAppProvider(
  options: TwilioWhatsAppProviderOptions
): WhatsAppOutreachProvider {
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    channel: "whatsapp",
    async getReadiness() {
      return {
        ...options.readiness,
        dailyLimit: options.dailyLimit,
        remainingToday: options.readiness.remainingToday ?? options.dailyLimit
      };
    },
    async send(input: WhatsAppSendInput) {
      try {
        const body = new URLSearchParams({
          From: withWhatsappPrefix(options.from),
          To: withWhatsappPrefix(input.to)
        });
        const templateContentSid = selectTemplateContentSid(options, input);
        if (input.templateVariables) {
          if (!templateContentSid) {
            return {
              status: "failed_send",
              providerName: "twilio",
              diagnosticCode: "missing_whatsapp_template_sid",
              diagnosticMessage:
                input.templateLanguage === "en"
                  ? "Configure TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID_EN before sending an English first-contact template."
                  : "Configure TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID before sending a Portuguese first-contact template."
            };
          }
          const invalidKeys = invalidTemplateVariables(input.templateVariables);
          if (invalidKeys) {
            return {
              status: "failed_send",
              providerName: "twilio",
              diagnosticCode: "invalid_content_variables",
              diagnosticMessage: `WhatsApp template variables ${invalidKeys.join(", ")} are empty or contain line breaks. Regenerate the draft before sending.`
            };
          }
          body.set("ContentSid", templateContentSid);
          body.set("ContentVariables", JSON.stringify(input.templateVariables));
        } else {
          body.set("Body", input.message);
        }

        const response = await fetchImpl(
          `https://api.twilio.com/2010-04-01/Accounts/${options.accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${options.accountSid}:${options.authToken}`
              ).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body
          }
        );
        const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        if (!response.ok) {
          return normalizeTwilioFailure(response.status, payload);
        }
        const providerStatus = String(payload.status ?? response.status);
        return {
          status: "sent",
          providerName: "twilio",
          providerMessageId: typeof payload.sid === "string" ? payload.sid : undefined,
          providerStatus,
          ...twilioAcceptedDiagnostic(providerStatus),
          safePayload: scrubProviderPayload(payload)
        };
      } catch (error) {
        return {
          status: "failed_send",
          providerName: "twilio",
          diagnosticCode: "provider_network_error",
          diagnosticMessage:
            error instanceof Error ? error.message : "Unable to reach the WhatsApp provider."
        };
      }
    }
  };
}