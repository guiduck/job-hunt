import { NextResponse } from "next/server";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { updateBulkOutreachItem } from "@/lib/freelance/bulk-outreach-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ batchId: string; itemId: string }> }
) {
  try {
    const { batchId, itemId } = await params;
    const result = await updateBulkOutreachItem(
      await getCurrentUserScope(),
      batchId,
      itemId,
      await request.json()
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update outreach item." },
      { status: 400 }
    );
  }
}
