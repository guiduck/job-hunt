import { NextResponse } from "next/server";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import {
  approveBulkOutreachBatch,
  ChannelNotReadyError
} from "@/lib/freelance/outreach-delivery-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;
    const result = await approveBulkOutreachBatch(
      await getCurrentUserScope(),
      batchId,
      await request.json()
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ChannelNotReadyError) {
      return NextResponse.json(
        {
          error: "channel_not_ready",
          diagnosticCode: error.readiness.diagnosticCode,
          diagnosticMessage: error.readiness.diagnosticMessage,
          missingEnvVars: error.readiness.missingEnvVars,
          requiredEnvVars: error.readiness.requiredEnvVars,
          providerName: error.readiness.providerName,
          status: error.readiness.status
        },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to approve delivery." },
      { status: 400 }
    );
  }
}
