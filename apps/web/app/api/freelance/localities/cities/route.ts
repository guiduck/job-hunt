import { NextResponse } from "next/server";
import { listLocalityCities, type LocalityMarketScope } from "@/lib/freelance/locality-service";

function parseMarketScope(value: string | null): LocalityMarketScope {
  return value === "INTERNATIONAL" ? "INTERNATIONAL" : "BR";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const items = await listLocalityCities(
      parseMarketScope(url.searchParams.get("marketScope")),
      url.searchParams.get("state") ?? "",
      url.searchParams.get("q") ?? ""
    );
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load cities." },
      { status: 502 }
    );
  }
}
