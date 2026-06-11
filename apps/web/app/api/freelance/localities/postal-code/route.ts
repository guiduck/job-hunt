import { NextResponse } from "next/server";
import { lookupBrazilianPostalCode } from "@/lib/freelance/locality-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const item = await lookupBrazilianPostalCode(url.searchParams.get("postalCode") ?? "");
    if (!item) {
      return NextResponse.json({ error: "CEP not found." }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load CEP." },
      { status: 502 }
    );
  }
}
