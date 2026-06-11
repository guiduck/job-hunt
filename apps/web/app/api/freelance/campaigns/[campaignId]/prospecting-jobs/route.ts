import { NextResponse } from "next/server";
import { createProspectingJob, getProspectingJob } from "@/lib/freelance/job-service";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { processProspectingJob } from "@/worker/jobs/process-prospecting-job";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      maxResults?: number;
      providerName?: string;
    };
    const job = await createProspectingJob(await getCurrentUserScope(), campaignId, body);

    const scope = await getCurrentUserScope();
    if (job.providerName === "mock") {
      await processProspectingJob(job.id);
      const processedJob = await getProspectingJob(scope, job.id);
      return NextResponse.json(processedJob ?? job, { status: 201 });
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start prospecting job.";
    const status = message.includes("active") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
