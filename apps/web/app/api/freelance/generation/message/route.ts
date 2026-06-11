import { NextResponse } from "next/server";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { generateCommercialMessage } from "@/lib/freelance/generation-service";

export async function POST(request: Request) {
  try {
    const item = await generateCommercialMessage(await getCurrentUserScope(), await request.json());
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate message." },
      { status: 400 }
    );
  }
}
