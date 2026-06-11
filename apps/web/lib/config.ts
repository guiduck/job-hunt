import { z } from "zod";

const configSchema = z.object({
  databaseUrl: z.string().min(1),
  authApiBaseUrl: z.string().url(),
  webAppBaseUrl: z.string().url(),
  apifyToken: z.string().optional(),
  serpapiApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  aiFreelanceModel: z.string().default("gpt-4o-mini")
});

export type AppConfig = z.infer<typeof configSchema>;

export function getAppConfig(env = process.env): AppConfig {
  return configSchema.parse({
    databaseUrl:
      env.DATABASE_URL ??
      "postgresql://scrapper:scrapper@localhost:5432/scrapper_freelance",
    authApiBaseUrl: env.FREELANCE_AUTH_API_BASE_URL ?? "http://localhost:8000",
    webAppBaseUrl: env.FREELANCE_WEB_APP_BASE_URL ?? "http://localhost:3000",
    apifyToken: env.APIFY_TOKEN,
    serpapiApiKey: env.SERPAPI_API_KEY,
    openaiApiKey: env.OPENAI_API_KEY,
    aiFreelanceModel: env.AI_FREELANCE_MODEL ?? "gpt-4o-mini"
  });
}
