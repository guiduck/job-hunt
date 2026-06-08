import { NextResponse } from "next/server";
import { listNiches } from "@/lib/freelance/campaign-service";

export async function GET() {
  const items = await listNiches();
  return NextResponse.json({ items });
}
