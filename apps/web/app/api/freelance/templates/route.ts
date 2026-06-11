import { NextResponse } from "next/server";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import {
  createCommercialTemplate,
  listCommercialTemplates
} from "@/lib/freelance/template-service";

export async function GET() {
  const items = await listCommercialTemplates(await getCurrentUserScope());
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const item = await createCommercialTemplate(await getCurrentUserScope(), await request.json());
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create template." },
      { status: 400 }
    );
  }
}
