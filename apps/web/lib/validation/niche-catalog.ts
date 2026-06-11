import { z } from "zod";
import { slugifyNiche } from "@/lib/freelance/niche-normalization";

export const marketApplicabilitySchema = z.enum(["BR", "INTERNATIONAL", "both"]);
export const lifecycleStatusSchema = z.enum(["approved", "disabled", "merged"]);
export const candidateDecisionSchema = z.enum([
  "approve",
  "reject",
  "defer",
  "mark_already_covered"
]);

const stringArraySchema = z.array(z.string().trim().min(1)).default([]);

const nicheBaseSchema = z
  .object({
    displayName: z.string().trim().min(2),
    marketApplicability: marketApplicabilitySchema.default("both"),
    conversionHint: z.coerce.number().min(0).max(100).optional(),
    conversionHintSource: z.enum(["text_seed", "visual_reference", "operator_override"]),
    aliases: stringArraySchema,
    queryTerms: stringArraySchema,
    sourcePath: z.string().trim().min(1),
    sourceNote: z.string().trim().min(1),
    enabled: z.boolean().default(true),
    sortOrder: z.coerce.number().int().default(0)
  });

export const nicheCreateSchema = nicheBaseSchema
  .superRefine((value, ctx) => {
    if (value.enabled && value.queryTerms.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["queryTerms"],
        message: "Enabled niches require at least one query term."
      });
    }
  })
  .transform((value) => ({
    ...value,
    slug: slugifyNiche(value.displayName)
  }));

export const nicheUpdateSchema = nicheBaseSchema
  .partial()
  .extend({
    lifecycleStatus: lifecycleStatusSchema.optional(),
    mergedIntoNicheId: z.string().min(1).optional().nullable()
  })
  .superRefine((value, ctx) => {
    if (value.lifecycleStatus === "merged" && !value.mergedIntoNicheId) {
      ctx.addIssue({
        code: "custom",
        path: ["mergedIntoNicheId"],
        message: "Merged niches require a target niche."
      });
    }
  });

export const nicheCandidateDecisionInputSchema = z
  .object({
    decision: candidateDecisionSchema,
    matchedNicheId: z.string().min(1).optional(),
    decisionReason: z.string().trim().min(1).optional(),
    approvedOverrides: nicheBaseSchema.partial().optional()
  })
  .superRefine((value, ctx) => {
    if (value.decision === "mark_already_covered" && !value.matchedNicheId) {
      ctx.addIssue({
        code: "custom",
        path: ["matchedNicheId"],
        message: "Already-covered candidates require a matched niche."
      });
    }
    if ((value.decision === "reject" || value.decision === "defer") && !value.decisionReason) {
      ctx.addIssue({
        code: "custom",
        path: ["decisionReason"],
        message: "Rejected and deferred candidates require a decision reason."
      });
    }
  });

export const nicheAuditQuerySchema = z.object({
  fresh: z.coerce.boolean().optional().default(false),
  includeDisabled: z.coerce.boolean().optional().default(true)
});

export type NicheCreateInput = z.infer<typeof nicheCreateSchema>;
export type NicheUpdateInput = z.infer<typeof nicheUpdateSchema>;
