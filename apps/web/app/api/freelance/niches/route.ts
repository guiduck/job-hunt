import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { listNiches, serializeNiche } from "@/lib/freelance/campaign-service";
import { createNiche, NicheServiceError } from "@/lib/freelance/niche-service";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const includeDisabled = searchParams.get("includeDisabled") === "true";
  const includeAuditFields = searchParams.get("includeAuditFields") === "true";
  const items = await listNiches({ includeDisabled, includeAuditFields });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const item = await createNiche(await request.json());
    return NextResponse.json(serializeNiche(item), { status: 201 });
  } catch (error) {
    const status =
      error instanceof NicheServiceError
        ? error.statusCode
        : error instanceof ZodError
          ? 422
          : 400;
    const message =
      error instanceof NicheServiceError
        ? error.message
        : error instanceof ZodError
          ? "Invalid niche fields."
          : "Unable to create niche.";
    return NextResponse.json({ error: message }, { status });
  }
}
