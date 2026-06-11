import { NextResponse } from "next/server";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { getProspectingJob } from "@/lib/freelance/job-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = await getProspectingJob(await getCurrentUserScope(), jobId);

  if (!job) {
    return NextResponse.json({ error: "Prospecting job not found." }, { status: 404 });
  }

  return NextResponse.json(job);
}
