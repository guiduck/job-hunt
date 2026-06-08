import { normalizedBusinessCandidateSchema } from "@/lib/validation/freelance";

export type FreelanceMapsSearchInput = {
  jobId: string;
  campaignId: string;
  marketScope: "BR" | "INTERNATIONAL";
  country: string;
  region?: string;
  city: string;
  nicheName: string;
  queryTerms: string[];
  maxResults: number;
};

export type NormalizedBusinessCandidate = {
  providerName: string;
  sourceQuery: string;
  sourceName: string;
  sourceUrl?: string;
  sourceIdentifier?: string;
  businessName: string;
  category?: string;
  address?: string;
  country: string;
  region?: string;
  city: string;
  phone?: string;
  websiteUrl?: string;
  rating?: number;
  reviewCount?: number;
  rawEvidence: string;
  rawProviderPayload: Record<string, unknown>;
};

export type FreelanceMapsProvider = {
  name: string;
  search(input: FreelanceMapsSearchInput): Promise<NormalizedBusinessCandidate[]>;
};

export function normalizeBusinessCandidate(
  candidate: NormalizedBusinessCandidate
): NormalizedBusinessCandidate {
  return normalizedBusinessCandidateSchema.parse({
    ...candidate,
    businessName: candidate.businessName.trim(),
    sourceQuery: candidate.sourceQuery.trim(),
    city: candidate.city.trim()
  });
}
