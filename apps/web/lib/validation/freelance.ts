import { z } from "zod";
import {
  campaignStatuses,
  commercialStatuses,
  generatedPromptVariants,
  leadTemperatures,
  marketScopes,
  templateStages,
  websiteStatuses
} from "@/lib/freelance/constants";

const optionalText = z.string().trim().optional().nullable();
const emptyStringToUndefined = (value: unknown) => (value === "" ? undefined : value);
const optionalQueryText = z.preprocess(emptyStringToUndefined, z.string().trim().optional());

export const campaignCreateSchema = z.object({
  name: optionalText,
  marketScope: z.enum(marketScopes),
  country: z.string().trim().min(1),
  region: optionalText,
  state: optionalText,
  city: z.string().trim().min(1),
  nicheId: z.string().trim().min(1),
  searchSettings: z.record(z.string(), z.unknown()).default({})
});

export const campaignUpdateSchema = z.object({
  name: optionalText,
  status: z.enum(campaignStatuses).optional(),
  notes: optionalText,
  searchSettings: z.record(z.string(), z.unknown()).optional()
});

export const leadFiltersSchema = z.object({
  campaignId: optionalQueryText,
  nicheId: optionalQueryText,
  q: optionalQueryText,
  city: optionalQueryText,
  websiteStatus: z.preprocess(emptyStringToUndefined, z.enum(websiteStatuses).optional()),
  commercialStatus: z.preprocess(emptyStringToUndefined, z.enum(commercialStatuses).optional()),
  temperature: z.preprocess(emptyStringToUndefined, z.enum(leadTemperatures).optional()),
  minScore: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().min(0).max(100).optional()
  )
});

export const leadUpdateSchema = z.object({
  commercialStatus: z.enum(commercialStatuses).optional(),
  temperature: z.enum(leadTemperatures).optional(),
  demoUrl: optionalText,
  operatorNotes: optionalText
});

export const commercialTemplateSchema = z.object({
  name: z.string().trim().min(1),
  stage: z.enum(templateStages),
  category: optionalText,
  channel: z.enum(["email", "whatsapp", "any"]).default("any"),
  bodyTemplate: z.string().trim().min(1),
  isActive: z.boolean().default(true)
});

export const sellerSettingsSchema = z.object({
  defaultMarketScope: z.enum(marketScopes).default("BR"),
  sellerName: optionalText,
  sellerTitle: optionalText,
  sellerEmail: z.string().email().optional().or(z.literal("")),
  sellerWhatsapp: optionalText,
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  defaultCountry: optionalText,
  defaultCurrency: optionalText,
  offerTitle: optionalText,
  offerDescription: optionalText,
  landingPagePrice: z.coerce.number().nonnegative().optional(),
  installments: z.coerce.number().int().positive().optional(),
  deliveryTime: optionalText,
  preferredNicheIds: z.array(z.string()).default([]),
  extraContext: optionalText
});

export const lovableGenerationSchema = z.object({
  leadId: z.string().trim().min(1),
  variant: z.enum(generatedPromptVariants)
});

export const messageGenerationSchema = z.object({
  leadId: z.string().trim().min(1),
  stage: z.enum(templateStages),
  templateId: z.string().trim().min(1)
});

export const providerSearchInputSchema = z.object({
  jobId: z.string().min(1),
  campaignId: z.string().min(1),
  marketScope: z.enum(marketScopes),
  country: z.string().min(1),
  region: z.string().optional(),
  city: z.string().min(1),
  nicheName: z.string().min(1),
  queryTerms: z.array(z.string()).min(1),
  maxResults: z.number().int().min(1).max(100)
});

export const normalizedBusinessCandidateSchema = z.object({
  providerName: z.string().min(1),
  sourceQuery: z.string().min(1),
  sourceName: z.string().min(1),
  sourceUrl: z.string().optional(),
  sourceIdentifier: z.string().optional(),
  businessName: z.string().min(1),
  category: z.string().optional(),
  address: z.string().optional(),
  country: z.string().min(1),
  region: z.string().optional(),
  city: z.string().min(1),
  phone: z.string().optional(),
  websiteUrl: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  rawEvidence: z.string().min(1),
  rawProviderPayload: z.record(z.string(), z.unknown()).default({})
});

export const websiteAnalysisOutputSchema = z.object({
  requestedUrl: z.string().min(1),
  finalUrl: z.string().optional(),
  httpStatus: z.number().int().optional(),
  reachable: z.boolean(),
  httpsEnabled: z.boolean(),
  redirected: z.boolean().default(false),
  detectedStatus: z.enum(websiteStatuses),
  title: z.string().optional(),
  metaDescription: z.string().optional(),
  headings: z.array(z.string()).default([]),
  ctaTexts: z.array(z.string()).default([]),
  phoneSignals: z.array(z.string()).default([]),
  whatsappSignals: z.array(z.string()).default([]),
  emailSignals: z.array(z.string()).default([]),
  evidencePoints: z.array(z.string()).default([])
});
