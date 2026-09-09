import { WhatsAppInbox } from "@/components/whatsapp/whatsapp-inbox";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import {
  listWhatsAppConversations,
  listWhatsAppMessages
} from "@/lib/freelance/whatsapp-conversation-service";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const scope = await getCurrentUserScope();
  const conversations = await listWhatsAppConversations(scope);
  const selectedId = conversations[0]?.id ?? null;
  const messages = selectedId ? await listWhatsAppMessages(scope, selectedId) : [];

  return (
    <div className="w-full min-w-0 space-y-5">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">Inbox</p>
        <h1 className="mt-3 text-3xl font-semibold">WhatsApp conversations</h1>
      </div>
      <WhatsAppInbox
        initialConversations={conversations}
        initialMessages={messages}
        initialSelectedId={selectedId}
      />
    </div>
  );
}
