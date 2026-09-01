import twilio from "twilio";

function firstForwardedValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

export function getTwilioWebhookUrlCandidates(request: Request) {
  const requestUrl = new URL(request.url);
  const pathAndQuery = `${requestUrl.pathname}${requestUrl.search}`;
  const configuredBase =
    process.env.TWILIO_WEBHOOK_BASE_URL || process.env.FREELANCE_WEB_APP_BASE_URL;
  const forwardedProto = firstForwardedValue(request.headers.get("x-forwarded-proto"));
  const forwardedHost =
    firstForwardedValue(request.headers.get("x-original-host")) ||
    firstForwardedValue(request.headers.get("x-forwarded-host")) ||
    firstForwardedValue(request.headers.get("host"));

  const candidates = [
    configuredBase ? new URL(pathAndQuery, configuredBase).toString() : null,
    forwardedProto && forwardedHost
      ? `${forwardedProto}://${forwardedHost}${pathAndQuery}`
      : null,
    request.url
  ];

  return Array.from(new Set(candidates.filter((value): value is string => Boolean(value))));
}

export function validateTwilioWebhookRequest(input: {
  request: Request;
  params: Record<string, string>;
  authToken?: string;
}) {
  if (process.env.TWILIO_DISABLE_WEBHOOK_VALIDATION === "true") {
    return { valid: true, validatedUrl: "validation-disabled", candidates: [] };
  }

  const signature = input.request.headers.get("x-twilio-signature");
  const candidates = getTwilioWebhookUrlCandidates(input.request);
  if (!input.authToken || !signature) {
    return { valid: false, validatedUrl: null, candidates };
  }

  const validatedUrl =
    candidates.find((url) =>
      twilio.validateRequest(input.authToken ?? "", signature, url, input.params)
    ) ?? null;

  return {
    valid: Boolean(validatedUrl),
    validatedUrl,
    candidates
  };
}
