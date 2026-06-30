import { NextResponse } from "next/server";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { getLeadOutreachEvents } from "@/lib/freelance/outreach-delivery-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const items = await getLeadOutreachEvents(await getCurrentUserScope(), leadId);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to read outreach history." },
      { status: 404 }
    );
  }
}
