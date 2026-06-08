import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { updateCampaign } from "@/lib/freelance/campaign-service";
import { getCurrentUserScope } from "@/lib/freelance/current-user";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;
    const item = await updateCampaign(
      getCurrentUserScope(),
      campaignId,
      await request.json()
    );

    if (!item) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    const message =
      error instanceof ZodError
        ? "Invalid campaign fields."
        : error instanceof Error
          ? error.message
          : "Unable to update campaign.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
