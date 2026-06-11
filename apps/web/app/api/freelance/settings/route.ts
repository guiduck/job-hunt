import { NextResponse } from "next/server";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { getSellerSettings, upsertSellerSettings } from "@/lib/freelance/settings-service";

export async function GET() {
  const item = await getSellerSettings(await getCurrentUserScope());
  return NextResponse.json(item ?? {});
}

export async function PUT(request: Request) {
  try {
    const item = await upsertSellerSettings(await getCurrentUserScope(), await request.json());
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save settings." },
      { status: 400 }
    );
  }
}
