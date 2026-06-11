import { leadFiltersSchema, leadUpdateSchema } from "@/lib/validation/freelance";
import { freelanceRepositories, requireOwnerScope, type OwnerScope } from "./repositories";
import type { NormalizedBusinessCandidate } from "@/lib/providers/freelance-maps-provider";
import type { WebsiteAnalysisResult } from "@/worker/website-analysis/types";
import { getOwnedWebsiteUrl, getSocialProfileUrl } from "./url-classification";

export async function listLeads(scope: OwnerScope, filters: unknown = {}) {
  const { userId } = requireOwnerScope(scope);
  const parsed = leadFiltersSchema.parse(filters);
  return freelanceRepositories.leads.findMany({
    where: {
      userId,
      ...(parsed.campaignId ? { campaignId: parsed.campaignId } : {}),
      ...(parsed.nicheId ? { nicheId: parsed.nicheId } : {}),
      ...(parsed.city ? { city: { contains: parsed.city, mode: "insensitive" } } : {}),
      ...(parsed.websiteStatus ? { websiteStatus: parsed.websiteStatus } : {}),
      ...(parsed.commercialStatus ? { commercialStatus: parsed.commercialStatus } : {}),
      ...(parsed.temperature ? { temperature: parsed.temperature } : {}),
      ...(parsed.minScore != null ? { leadScore: { gte: parsed.minScore } } : {}),
      ...(parsed.q
        ? {
            OR: [
              { businessName: { contains: parsed.q, mode: "insensitive" } },
              { category: { contains: parsed.q, mode: "insensitive" } },
              { city: { contains: parsed.q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: { capturedAt: "desc" },
    include: { campaign: true, niche: true }
  });
}

export async function getLead(scope: OwnerScope, leadId: string) {
  const { userId } = requireOwnerScope(scope);
  return freelanceRepositories.leads.findFirst({
    where: { id: leadId, userId },
    include: { websiteAnalyses: true, latestGenerated: true }
  });
}

export async function updateLead(scope: OwnerScope, leadId: string, payload: unknown) {
  const { userId } = requireOwnerScope(scope);
  const input = leadUpdateSchema.parse(payload);
  const existing = await freelanceRepositories.leads.findFirst({
    where: { id: leadId, userId }
  });
  if (!existing) {
    return null;
  }
  return freelanceRepositories.leads.update({
    where: { id: leadId },
    data: {
      ...(input.commercialStatus ? { commercialStatus: input.commercialStatus } : {}),
      ...(input.temperature ? { temperature: input.temperature } : {}),
      ...(input.demoUrl !== undefined ? { demoUrl: input.demoUrl || null } : {}),
      ...(input.operatorNotes !== undefined ? { operatorNotes: input.operatorNotes || null } : {})
    },
    include: { websiteAnalyses: true, latestGenerated: true }
  });
}

export async function saveLeadWithAnalysis({
  userId,
  campaignId,
  jobId,
  nicheId,
  candidate,
  analysis
}: {
  userId: string;
  campaignId: string;
  jobId: string;
  nicheId: string;
  candidate: NormalizedBusinessCandidate;
  analysis: WebsiteAnalysisResult;
}) {
  const scores = analysis.scores;
  const websiteUrl = getOwnedWebsiteUrl(candidate.websiteUrl);
  const socialUrl = getSocialProfileUrl(candidate.websiteUrl);
  const lead = await freelanceRepositories.leads.create({
    data: {
      userId,
      campaignId,
      jobId,
      nicheId,
      businessName: candidate.businessName,
      category: candidate.category,
      country: candidate.country,
      region: candidate.region,
      city: candidate.city,
      address: candidate.address,
      phone: candidate.phone,
      websiteUrl,
      socialUrl,
      websiteStatus: analysis.detectedStatus,
      sourceName: candidate.sourceName,
      sourceUrl: candidate.sourceUrl,
      sourceQuery: candidate.sourceQuery,
      sourceIdentifier: candidate.sourceIdentifier,
      sourceEvidence: candidate.rawEvidence,
      googleRating: candidate.rating,
      googleReviewCount: candidate.reviewCount,
      leadScore: scores?.overallOpportunity ?? 0,
      contentScore: scores?.content,
      designScore: scores?.design,
      performanceScore: scores?.performance,
      seoScore: scores?.seo,
      temperature: (scores?.overallOpportunity ?? 0) >= 80 ? "hot" : "warm",
      classificationReasons: analysis.evidencePoints
    }
  });

  await freelanceRepositories.websiteAnalyses.create({
    data: {
      userId,
      leadId: lead.id,
      requestedUrl: analysis.requestedUrl || websiteUrl || "",
      finalUrl: analysis.finalUrl,
      httpStatus: analysis.httpStatus,
      reachable: analysis.reachable,
      httpsEnabled: analysis.httpsEnabled,
      redirected: analysis.redirected,
      detectedStatus: analysis.detectedStatus,
      title: analysis.title,
      metaDescription: analysis.metaDescription,
      headings: analysis.headings,
      ctaTexts: analysis.ctaTexts,
      phoneSignals: analysis.phoneSignals,
      whatsappSignals: analysis.whatsappSignals,
      emailSignals: analysis.emailSignals,
      contentScore: scores?.content,
      designScore: scores?.design,
      performanceScore: scores?.performance,
      seoScore: scores?.seo,
      overallOpportunityScore: scores?.overallOpportunity,
      evidencePoints: analysis.evidencePoints
    }
  });

  return lead;
}
