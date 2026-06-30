import { NextResponse } from "next/server";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { getChannelSettings, updateChannelSetting } from "@/lib/freelance/channel-settings-service";

export async function GET() {
  const items = await getChannelSettings(await getCurrentUserScope());
  return NextResponse.json({ items });
}

export async function PATCH(request: Request) {
  try {
    const item = await updateChannelSetting(await getCurrentUserScope(), await request.json());
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save channel settings." },
      { status: 400 }
    );
  }
}
