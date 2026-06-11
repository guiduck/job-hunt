import { prisma } from "@/lib/prisma";

export type OwnerScope = {
  userId: string;
};

export function requireOwnerScope(scope: OwnerScope) {
  if (!scope.userId) {
    throw new Error("Owner scope is required for Freelance data access.");
  }
  return scope;
}

export const freelanceRepositories = {
  niches: prisma.freelanceNiche,
  nicheCandidates: prisma.nicheCandidate,
  nicheAuditRuns: prisma.nicheAuditRun,
  nicheAuditFindings: prisma.nicheAuditFinding,
  campaigns: prisma.freelanceCampaign,
  jobs: prisma.prospectingJob,
  leads: prisma.freelanceLead,
  websiteAnalyses: prisma.websiteAnalysis,
  templates: prisma.commercialTemplate,
  settings: prisma.sellerSettings,
  generatedTexts: prisma.latestGeneratedText
};
