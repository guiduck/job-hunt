import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import {
  deleteNichePortfolioExample,
  PortfolioServiceError,
  upsertNichePortfolioExample
} from "@/lib/freelance/portfolio-service";

function errorResponse(error: unknown) {
  const status =
    error instanceof PortfolioServiceError ? error.statusCode : error instanceof ZodError ? 422 : 400;
  const message =
    error instanceof PortfolioServiceError
      ? error.message
      : error instanceof ZodError
        ? error.issues[0]?.message ?? "Invalid portfolio fields."
        : "Unable to update the portfolio example.";
  return NextResponse.json({ error: message }, { status });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ nicheId: string }> }
) {
  const { nicheId } = await params;
  try {
    const item = await upsertNichePortfolioExample(
      await getCurrentUserScope(),
      nicheId,
      await request.json()
    );
    return NextResponse.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ nicheId: string }> }
) {
  const { nicheId } = await params;
  try {
    return NextResponse.json({
      item: await deleteNichePortfolioExample(await getCurrentUserScope(), nicheId)
    });
  } catch (error) {
    return errorResponse(error);
  }
}
