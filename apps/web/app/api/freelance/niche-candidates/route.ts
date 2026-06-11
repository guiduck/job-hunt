import { NextResponse } from "next/server";
import { listNicheCandidates } from "@/lib/freelance/niche-candidate-service";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const status = searchParams.get("status");
  const market = searchParams.get("market");
  const items = await listNicheCandidates({ status, market });

  return NextResponse.json({ items });
}
