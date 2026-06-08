import "server-only";
import { z } from "zod";

const configSchema = z.object({
  databaseUrl: z.string().min(1),
  freelanceMapsProvider: z
    .enum(["mock", "apify_google_maps", "serpapi_google_maps"])
    .default("mock"),
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
    freelanceMapsProvider: env.FREELANCE_MAPS_PROVIDER ?? "mock",
    apifyToken: env.APIFY_TOKEN,
    serpapiApiKey: env.SERPAPI_API_KEY,
    openaiApiKey: env.OPENAI_API_KEY,
    aiFreelanceModel: env.AI_FREELANCE_MODEL ?? "gpt-4o-mini"
  });
}
