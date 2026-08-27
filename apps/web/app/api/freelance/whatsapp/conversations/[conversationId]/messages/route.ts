import { NextResponse } from "next/server";
import { createWhatsAppProvider } from "@/lib/providers/whatsapp-provider";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import {
  getWhatsAppConversation,
  listWhatsAppMessages,
  markWhatsAppConversationRead,
  recordOutboundWhatsAppMessage
} from "@/lib/freelance/whatsapp-conversation-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const scope = await getCurrentUserScope();
  const messages = await listWhatsAppMessages(scope, conversationId);
  const shouldMarkRead = new URL(request.url).searchParams.get("markRead") === "1";
  if (shouldMarkRead) {
    await markWhatsAppConversationRead(scope, conversationId);
  }
  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const scope = await getCurrentUserScope();
  const conversation = await getWhatsAppConversation(scope, conversationId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({})) as { body?: string };
  const message = body.body?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ error: "Message body is required." }, { status: 400 });
  }

  const provider = createWhatsAppProvider();
  const result = await provider.send({
    to: conversation.contactPhone,
    message,
    metadata: {
      userId: scope.userId,
      batchId: "whatsapp-inbox",
      itemId: conversation.id,
      leadId: conversation.leadId ?? conversation.id
    }
  });

  if (result.status !== "sent") {
    return NextResponse.json(
      { error: result.diagnosticMessage ?? "Unable to send WhatsApp reply.", result },
      { status: 409 }
    );
  }

  await recordOutboundWhatsAppMessage({
    userId: scope.userId,
    leadId: conversation.leadId,
    to: conversation.contactPhone,
    from: process.env.TWILIO_WHATSAPP_FROM ?? "",
    body: message,
    providerMessageId: result.providerMessageId,
    providerStatus: result.providerStatus,
    payload: result.safePayload
  });

  const messages = await listWhatsAppMessages(scope, conversation.id);
  return NextResponse.json({ result, messages });
}
