import { NextResponse } from "next/server";
import { buildGoogleAuthStartUrl } from "@/lib/auth/session";

export async function GET() {
  return NextResponse.redirect(await buildGoogleAuthStartUrl());
}
