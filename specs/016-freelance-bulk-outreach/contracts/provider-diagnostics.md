# Provider Diagnostics Contract: Email and WhatsApp

Provider adapters in `apps/web` must return normalized readiness and delivery results. Raw provider responses may be stored only after scrubbing secrets and should not be shown directly to browser UI.

## Common Types

### ChannelReadiness

```ts
type ChannelReadiness = {
  channel: "email" | "whatsapp";
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
```

### DeliveryResult

```ts
type DeliveryResult = {
  status: "sent" | "failed_send" | "blocked";
  providerName: string;
  providerMessageId?: string;
  providerStatus?: string;
  diagnosticCode?: string;
  diagnosticMessage?: string;
  retryAfter?: string;
  safePayload?: Record<string, unknown>;
};
```

## Required Diagnostic Codes

- `missing_env`
- `missing_credentials`
- `provider_not_configured`
- `provider_not_approved`
- `template_required`
- `opt_in_required`
- `message_window_closed`
- `daily_limit_reached`
- `provider_rate_limited`
- `provider_unauthorized`
- `provider_rejected`
- `network_error`
- `unknown_provider_error`

## Email Adapter Requirements

Readiness must check:

- Provider selected by server-side config
- Required env vars by name
- Sender/display address readiness
- Daily channel cap and remaining capacity

Send input:

```ts
type EmailSendInput = {
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
```

Provider output must normalize:

- sent provider message id
- provider rejected/unauthorized/rate-limited states
- missing config states
- network failures

## WhatsApp Adapter Requirements

Readiness must check:

- Provider selected by server-side config
- Required env vars by name
- Sender/business number readiness
- Account approval or provider availability when knowable
- Template requirement state when knowable
- Daily channel cap and remaining capacity

Send input:

```ts
type WhatsAppSendInput = {
  to: string;
  message: string;
  templateName?: string;
  metadata: {
    userId: string;
    batchId: string;
    itemId: string;
    leadId: string;
  };
};
```

Provider output must normalize:

- sent provider message id
- provider rejected/unauthorized/rate-limited states
- missing config states
- template required states
- opt-in/message-window blocked states
- network failures

## Secret Handling

- Never expose secret values in diagnostics.
- `missingEnvVars` contains names only.
- `safePayload` must not include tokens, API keys, OAuth secrets, auth headers, or full raw provider request bodies.

## UI Message Requirements

Every blocked or failed result must include:

- stable `diagnosticCode`
- operator-readable `diagnosticMessage`
- channel
- provider name when configured
- likely next action, when known

Examples:

- `missing_env`: "Configure RESEND_API_KEY before sending email."
- `missing_env`: "Configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN before sending WhatsApp messages."
- `template_required`: "The WhatsApp provider requires an approved template for this message."
- `provider_rate_limited`: "The provider rate limit was reached. Try again after the reset time."
