import { NextResponse } from "next/server";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { generateBulkOutreachBatch } from "@/lib/freelance/bulk-generation-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;
    const result = await generateBulkOutreachBatch(
      await getCurrentUserScope(),
      batchId,
      await request.json()
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate batch." },
      { status: 400 }
    );
  }
}
