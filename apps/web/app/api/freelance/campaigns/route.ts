import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createCampaign,
  listCampaigns
} from "@/lib/freelance/campaign-service";
import { getCurrentUserScope } from "@/lib/freelance/current-user";

export async function GET() {
  const items = await listCampaigns(await getCurrentUserScope());
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const item = await createCampaign(await getCurrentUserScope(), await request.json());
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message =
      error instanceof ZodError
        ? "Invalid campaign fields."
        : error instanceof Error
          ? error.message
          : "Unable to create campaign.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
