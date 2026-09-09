import { z } from "zod";

const optionalText = z.string().trim().max(500).optional().nullable();
const optionalHttpUrl = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .nullable()
  .refine(
    (value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Use a complete http:// or https:// URL." }
  );

export const nichePortfolioUpsertSchema = z.object({
  projectName: optionalText,
  repositoryUrl: optionalHttpUrl,
  demoUrl: optionalHttpUrl,
  notes: z.string().trim().max(2000).optional().nullable()
});

export type NichePortfolioUpsertInput = z.infer<typeof nichePortfolioUpsertSchema>;
