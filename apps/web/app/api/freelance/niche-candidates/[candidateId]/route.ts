import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  decideNicheCandidate,
  NicheCandidateServiceError
} from "@/lib/freelance/niche-candidate-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ candidateId: string }> }
) {
  const { candidateId } = await context.params;

  try {
    const item = await decideNicheCandidate(candidateId, await request.json());
    return NextResponse.json(item);
  } catch (error) {
    const status =
      error instanceof NicheCandidateServiceError
        ? error.statusCode
        : error instanceof ZodError
          ? 422
          : 400;
    const message =
      error instanceof NicheCandidateServiceError
        ? error.message
        : error instanceof ZodError
          ? "Invalid candidate decision."
          : "Unable to update candidate.";
    return NextResponse.json({ error: message }, { status });
  }
}
