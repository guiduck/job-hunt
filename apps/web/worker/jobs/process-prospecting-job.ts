import { createFreelanceMapsProvider } from "@/lib/providers/provider-factory";
import { prisma } from "@/lib/prisma";
import { refreshCampaignCounters } from "@/lib/freelance/campaign-service";
import { saveLeadWithAnalysis } from "@/lib/freelance/lead-service";
import { getOwnedWebsiteUrl } from "@/lib/freelance/url-classification";
import { analyzeWebsite } from "@/worker/website-analysis/analyzer";
import { evaluateCandidate } from "./candidate-normalizer";
import { checkDuplicate, existingLeadDedupeKeys } from "./dedupe";

export async function processNextProspectingJob() {
  const job = await prisma.prospectingJob.findFirst({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    include: { campaign: true }
  });

  if (!job) {
    console.log(
      JSON.stringify({
        event: "freelance_worker_idle"
      })
    );
    return { processed: false };
  }

  return processProspectingJob(job.id);
}

async function loadExistingLeadKeys(userId: string, campaignId: string) {
  const leads = await prisma.freelanceLead.findMany({
    where: { userId, campaignId },
    select: {
      businessName: true,
      city: true,
      address: true,
      phone: true,
      websiteUrl: true,
      socialUrl: true,
      sourceIdentifier: true
    }
  });

  return new Set(leads.flatMap((lead) => existingLeadDedupeKeys(lead)));
}

export async function processProspectingJob(jobId: string) {
  const job = await prisma.prospectingJob.findUnique({
    where: { id: jobId },
    include: { campaign: true }
  });

  if (!job) {
    throw new Error("Prospecting job not found.");
  }

  const provider = createFreelanceMapsProvider(
    job.providerName === "apify_google_maps" || job.providerName === "mock"
      ? job.providerName
      : "serpapi_google_maps"
  );

  await prisma.prospectingJob.update({
    where: { id: job.id },
    data: { status: "running", currentStep: "discovering_businesses", startedAt: new Date() }
  });

  console.log(
    JSON.stringify({
      event: "freelance_worker_job_started",
      jobId: job.id,
      providerName: provider.name
    })
  );

  try {
    const candidates = await provider.search({
      jobId: job.id,
      campaignId: job.campaignId,
      marketScope: job.campaign.marketScope,
      country: job.campaign.country,
      region: job.campaign.state ?? job.campaign.region ?? undefined,
      city: job.campaign.city,
      nicheName: job.campaign.nicheNameSnapshot,
      queryTerms: [job.campaign.nicheNameSnapshot],
      maxResults: job.requestedMaxResults
    });

    await prisma.prospectingJob.update({
      where: { id: job.id },
      data: { currentStep: "normalizing_results", inspectedCount: candidates.length }
    });

    const seen = await loadExistingLeadKeys(job.userId, job.campaignId);
    let acceptedCount = 0;
    let duplicateCount = 0;
    let rejectedCount = 0;
    let failedCount = 0;

    for (const candidate of candidates) {
      const outcome = evaluateCandidate(candidate);
      if (outcome.status !== "accepted") {
        rejectedCount += 1;
        continue;
      }

      const duplicate = checkDuplicate(candidate, seen);
      if (duplicate.duplicate) {
        duplicateCount += 1;
        continue;
      }

      await prisma.prospectingJob.update({
        where: { id: job.id },
        data: { currentStep: "analyzing_websites" }
      });

      try {
        const analysis = await analyzeWebsite({
          leadId: undefined,
          websiteUrl: getOwnedWebsiteUrl(candidate.websiteUrl),
          businessName: candidate.businessName,
          city: candidate.city,
          nicheName: job.campaign.nicheNameSnapshot
        });

        await saveLeadWithAnalysis({
          userId: job.userId,
          campaignId: job.campaignId,
          jobId: job.id,
          nicheId: job.campaign.nicheId,
          candidate,
          analysis
        });
        acceptedCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    await prisma.prospectingJob.update({
      where: { id: job.id },
      data: {
        status: acceptedCount > 0 ? "completed" : "completed_no_results",
        currentStep: "done",
        acceptedCount,
        duplicateCount,
        rejectedCount,
        failedCount,
        providerStatus: "completed",
        diagnostics: {
          providerName: provider.name,
          rawResultCount: candidates.length,
          requestedMaxResults: job.requestedMaxResults,
          providerReturnedLessThanRequested: candidates.length < job.requestedMaxResults,
          acceptedCount,
          duplicateCount,
          rejectedCount,
          failedCount
        },
        completedAt: new Date()
      }
    });

    await prisma.freelanceCampaign.update({
      where: { id: job.campaignId },
      data: { status: acceptedCount > 0 ? "completed" : "ready" }
    });
    await refreshCampaignCounters({ userId: job.userId }, job.campaignId);

    console.log(
      JSON.stringify({
        event: "freelance_worker_job_completed",
        jobId: job.id,
        acceptedCount,
        duplicateCount,
        rejectedCount,
        failedCount
      })
    );

    return { processed: true, jobId: job.id, acceptedCount };
  } catch (error) {
    await prisma.prospectingJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        providerStatus: "failed",
        providerErrorMessage: error instanceof Error ? error.message : "Unknown provider failure",
        completedAt: new Date()
      }
    });
    await prisma.freelanceCampaign.update({
      where: { id: job.campaignId },
      data: { status: "failed" }
    });
    throw error;
  }
}
