"use client";

import { RefreshCcw, Send, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type {
  WhatsAppConversationView,
  WhatsAppMessageView
} from "@/lib/freelance/whatsapp-conversation-service";

function formatTime(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}


function deliveryLabel(status: string) {
  const labels: Record<string, string> = {
    accepted: "Aceita",
    queued: "Na fila",
    sending: "Enviando",
    sent: "Enviada",
    delivered: "Entregue",
    read: "Lida",
    failed: "Falhou",
    undelivered: "Nao entregue"
  };
  return labels[status.toLowerCase()] ?? status;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? "Request failed.");
  }
  return body;
}

export function WhatsAppInbox({
  initialConversations,
  initialMessages,
  initialSelectedId
}: {
  initialConversations: WhatsAppConversationView[];
  initialMessages: WhatsAppMessageView[];
  initialSelectedId: string | null;
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSending, startSendTransition] = useTransition();
  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  async function refreshConversations() {
    const body = await fetchJson<{ conversations: WhatsAppConversationView[] }>(
      "/api/freelance/whatsapp/conversations"
    );
    setConversations(body.conversations);
    if (!selectedId && body.conversations[0]) {
      setSelectedId(body.conversations[0].id);
    }
  }

  async function refreshMessages(conversationId = selectedId) {
    if (!conversationId) return;
    const body = await fetchJson<{ messages: WhatsAppMessageView[] }>(
      `/api/freelance/whatsapp/conversations/${conversationId}/messages`
    );
    setMessages(body.messages);
  }

  function selectConversation(conversationId: string) {
    setSelectedId(conversationId);
    setStatus(null);
    void refreshMessages(conversationId);
  }

  function sendReply() {
    if (!selectedId || !draft.trim()) return;
    const body = draft.trim();
    startSendTransition(async () => {
      setStatus("Sending...");
      try {
        const response = await fetchJson<{ messages: WhatsAppMessageView[] }>(
          `/api/freelance/whatsapp/conversations/${selectedId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body })
          }
        );
        setDraft("");
        setMessages(response.messages);
        await refreshConversations();
        setStatus("Sent.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Message was not sent.");
      }
    });
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshConversations();
      void refreshMessages();
    }, 5000);
    return () => window.clearInterval(timer);
  });

  return (
    <div className="grid min-h-[calc(100vh-180px)] overflow-hidden rounded-lg border border-slate-800 bg-slate-950 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="border-b border-slate-800 lg:border-b-0 lg:border-r">
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Smartphone className="h-4 w-4 text-cyan-300" aria-hidden="true" />
            <p className="truncate text-sm font-semibold text-slate-100">WhatsApp</p>
          </div>
          <Button
            aria-label="Refresh conversations"
            size="icon"
            variant="ghost"
            onClick={() => {
              void refreshConversations();
              void refreshMessages();
            }}
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="max-h-[calc(100vh-236px)] overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-5 text-sm text-slate-400">Nenhuma conversa ainda.</div>
          ) : (
            conversations.map((conversation) => {
              const active = conversation.id === selectedId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectConversation(conversation.id)}
                  className={`grid w-full gap-1 border-b border-slate-900 px-4 py-3 text-left transition ${
                    active ? "bg-cyan-950/30" : "hover:bg-slate-900/70"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-medium text-slate-100">
                      {conversation.businessName}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-500">
                      {formatTime(conversation.lastMessageAt)}
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-xs text-slate-400">
                      {conversation.lastMessagePreview ?? conversation.contactPhone}
                    </span>
                    {conversation.unreadInboundCount > 0 ? (
                      <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400 px-1.5 text-[11px] font-semibold text-slate-950">
                        {conversation.unreadInboundCount}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="flex min-h-[560px] flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
          {selectedConversation ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">
                {selectedConversation.businessName}
              </p>
              <p className="truncate text-xs text-slate-500">{selectedConversation.contactPhone}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Selecione uma conversa</p>
          )}
          {status ? <p className="max-w-sm truncate text-xs text-slate-400">{status}</p> : null}
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-950 px-4 py-5">
          {selectedConversation && messages.length === 0 ? (
            <p className="text-sm text-slate-500">Sem mensagens nessa conversa.</p>
          ) : null}
          {messages.map((message) => {
            const outbound = message.direction === "outbound";
            return (
              <div key={message.id} className={`flex ${outbound ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[min(76%,720px)] rounded-lg px-3 py-2 text-sm leading-6 shadow-sm ${
                    outbound
                      ? "bg-cyan-500 text-slate-950"
                      : "border border-slate-800 bg-slate-900 text-slate-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p className={`mt-1 text-right text-[11px] ${outbound ? "text-slate-800" : "text-slate-500"}`}>
                    {formatTime(message.occurredAt)}
                    {outbound && message.providerStatus
                      ? ` | ${deliveryLabel(message.providerStatus)}`
                      : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-800 p-3">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={!selectedConversation || isSending}
              rows={2}
              className="max-h-36 min-h-11 resize-y rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400 disabled:opacity-50"
              placeholder="Responder"
            />
            <Button onClick={sendReply} disabled={!selectedConversation || !draft.trim() || isSending}>
              <Send className="h-4 w-4" aria-hidden="true" />
              Enviar
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}