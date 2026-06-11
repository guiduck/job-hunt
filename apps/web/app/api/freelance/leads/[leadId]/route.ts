import { NextResponse } from "next/server";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { getLead, updateLead } from "@/lib/freelance/lead-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params;
  const item = await getLead(await getCurrentUserScope(), leadId);
  if (!item) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params;
  const item = await updateLead(await getCurrentUserScope(), leadId, await request.json());
  if (!item) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }
  return NextResponse.json(item);
}
