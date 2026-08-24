import { z } from "zod";

const configSchema = z.object({
  databaseUrl: z.string().min(1),
  authApiBaseUrl: z.string().url(),
  webAppBaseUrl: z.string().url(),
  apifyToken: z.string().optional(),
  serpapiApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  aiFreelanceModel: z.string().default("gpt-4o-mini"),
  freelanceEmailProvider: z.string().default("resend"),
  freelanceEmailDailyLimit: z.coerce.number().int().positive().default(500),
  freelanceEmailFrom: z.string().optional(),
  resendApiKey: z.string().optional(),
  freelanceWhatsappProvider: z.string().default("twilio"),
  freelanceWhatsappDailyLimit: z.coerce.number().int().positive().default(500),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioWhatsappFrom: z.string().optional(),
  twilioWhatsappTemplateContentSid: z.string().optional(),
  twilioWhatsappTemplateContentSidEn: z.string().optional()
});

export type AppConfig = z.infer<typeof configSchema>;
type EnvMap = Record<string, string | undefined>;

export function getAppConfig(env: EnvMap = process.env): AppConfig {
  return configSchema.parse({
    databaseUrl:
      env.DATABASE_URL ??
      "postgresql://scrapper:scrapper@localhost:5432/scrapper_freelance",
    authApiBaseUrl: env.FREELANCE_AUTH_API_BASE_URL ?? "http://localhost:8000",
    webAppBaseUrl: env.FREELANCE_WEB_APP_BASE_URL ?? "http://localhost:3000",
    apifyToken: env.APIFY_TOKEN,
    serpapiApiKey: env.SERPAPI_API_KEY,
    openaiApiKey: env.OPENAI_API_KEY,
    aiFreelanceModel: env.AI_FREELANCE_MODEL ?? "gpt-4o-mini",
    freelanceEmailProvider: env.FREELANCE_EMAIL_PROVIDER ?? "resend",
    freelanceEmailDailyLimit: env.FREELANCE_EMAIL_DAILY_LIMIT ?? "500",
    freelanceEmailFrom: env.FREELANCE_EMAIL_FROM,
    resendApiKey: env.RESEND_API_KEY,
    freelanceWhatsappProvider: env.FREELANCE_WHATSAPP_PROVIDER ?? "twilio",
    freelanceWhatsappDailyLimit: env.FREELANCE_WHATSAPP_DAILY_LIMIT ?? "500",
    twilioAccountSid: env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: env.TWILIO_AUTH_TOKEN,
    twilioWhatsappFrom: env.TWILIO_WHATSAPP_FROM,
    twilioWhatsappTemplateContentSid: env.TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID,
    twilioWhatsappTemplateContentSidEn: env.TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID_EN
  });
}

export type ChannelRuntimeConfig = {
  providerName: string;
  dailyLimit: number;
  requiredEnvVars: string[];
  missingEnvVars: string[];
  displayAddress?: string;
  templateContentSid?: string;
  templateContentSidEn?: string;
};

function missingEnvVars(env: EnvMap, names: string[]) {
  return names.filter((name) => !env[name]);
}

export function getEmailChannelConfig(env: EnvMap = process.env): ChannelRuntimeConfig {
  const appConfig = getAppConfig(env);
  const requiredEnvVars =
    appConfig.freelanceEmailProvider === "resend"
      ? ["RESEND_API_KEY", "FREELANCE_EMAIL_FROM"]
      : ["FREELANCE_EMAIL_FROM"];

  return {
    providerName: appConfig.freelanceEmailProvider,
    dailyLimit: appConfig.freelanceEmailDailyLimit,
    requiredEnvVars,
    missingEnvVars: missingEnvVars(env, requiredEnvVars),
    displayAddress: appConfig.freelanceEmailFrom
  };
}

export function getWhatsappChannelConfig(env: EnvMap = process.env): ChannelRuntimeConfig {
  const appConfig = getAppConfig(env);
  const requiredEnvVars =
    appConfig.freelanceWhatsappProvider === "twilio"
      ? ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM"]
      : ["TWILIO_WHATSAPP_FROM"];

  return {
    providerName: appConfig.freelanceWhatsappProvider,
    dailyLimit: appConfig.freelanceWhatsappDailyLimit,
    requiredEnvVars,
    missingEnvVars: missingEnvVars(env, requiredEnvVars),
    displayAddress: appConfig.twilioWhatsappFrom,
    templateContentSid: appConfig.twilioWhatsappTemplateContentSid,
    templateContentSidEn: appConfig.twilioWhatsappTemplateContentSidEn
  };
}
