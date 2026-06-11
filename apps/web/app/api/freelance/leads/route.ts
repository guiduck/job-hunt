import { NextResponse } from "next/server";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { listLeads } from "@/lib/freelance/lead-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const items = await listLeads(await getCurrentUserScope(), Object.fromEntries(searchParams));
  return NextResponse.json({ items, total: items.length });
}
