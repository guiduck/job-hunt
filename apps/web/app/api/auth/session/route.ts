import { NextResponse } from "next/server";
import { setFreelanceAuthSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      access_token?: string;
      user?: unknown;
    };
    if (!body.access_token) {
      return NextResponse.json({ error: "Missing access token." }, { status: 400 });
    }
    const user = await setFreelanceAuthSession({
      access_token: body.access_token,
      user: body.user as never
    });
    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save Google session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
