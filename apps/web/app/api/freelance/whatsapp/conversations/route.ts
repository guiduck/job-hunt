import { NextResponse } from "next/server";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { listWhatsAppConversations } from "@/lib/freelance/whatsapp-conversation-service";

export async function GET() {
  const conversations = await listWhatsAppConversations(await getCurrentUserScope());
  return NextResponse.json({ conversations });
}