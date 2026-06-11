import { NextResponse } from "next/server";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import {
  deleteCommercialTemplate,
  updateCommercialTemplate
} from "@/lib/freelance/template-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const item = await updateCommercialTemplate(
      await getCurrentUserScope(),
      templateId,
      await request.json()
    );
    if (!item) {
      return NextResponse.json({ error: "Template not found." }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update template." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  const item = await deleteCommercialTemplate(await getCurrentUserScope(), templateId);
  if (!item) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
