import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { serializeNiche } from "@/lib/freelance/campaign-service";
import { NicheServiceError, updateNiche } from "@/lib/freelance/niche-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ nicheId: string }> }
) {
  const { nicheId } = await context.params;

  try {
    const item = await updateNiche(nicheId, await request.json());
    return NextResponse.json(serializeNiche(item));
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
          : "Unable to update niche.";
    return NextResponse.json({ error: message }, { status });
  }
}
