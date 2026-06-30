import { NextResponse } from "next/server";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { getBulkOutreachBatch } from "@/lib/freelance/bulk-generation-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;
  const batch = await getBulkOutreachBatch(await getCurrentUserScope(), batchId);
  if (!batch) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }
  return NextResponse.json({ batch, items: batch.items });
}
