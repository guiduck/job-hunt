"use client";

import { RefreshCcw, Send, Smartphone } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import { Button } from "@/components/ui/button";
import type {
  WhatsAppConversationView,
  WhatsAppMessageView
} from "@/lib/freelance/whatsapp-conversation-service";

const DEFAULT_CONVERSATION_LIST_WIDTH = 360;
const MIN_CONVERSATION_LIST_WIDTH = 280;
const MAX_CONVERSATION_LIST_WIDTH = 560;
const KEYBOARD_RESIZE_STEP = 16;

function formatTime(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
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
  const [conversationListWidth, setConversationListWidth] = useState(
    DEFAULT_CONVERSATION_LIST_WIDTH
  );
  const [isSending, startSendTransition] = useTransition();
  const inboxRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const refreshConversations = useCallback(async () => {
    const body = await fetchJson<{ conversations: WhatsAppConversationView[] }>(
      "/api/freelance/whatsapp/conversations"
    );
    setConversations(body.conversations);
    if (!selectedId && body.conversations[0]) {
      setSelectedId(body.conversations[0].id);
    }
  }, [selectedId]);

  const refreshMessages = useCallback(async (conversationId = selectedId) => {
    if (!conversationId) return;
    const body = await fetchJson<{ messages: WhatsAppMessageView[] }>(
      `/api/freelance/whatsapp/conversations/${conversationId}/messages`
    );
    setMessages(body.messages);
  }, [selectedId]);

  function selectConversation(conversationId: string) {
    setSelectedId(conversationId);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unreadInboundCount: 0 }
          : conversation
      )
    );
    setStatus(null);
    void refreshMessages(conversationId);
  }

  function resizeBounds() {
    const availableWidth = inboxRef.current?.getBoundingClientRect().width ?? 0;
    const responsiveMaximum = availableWidth > 0 ? availableWidth * 0.5 : MAX_CONVERSATION_LIST_WIDTH;
    return {
      min: MIN_CONVERSATION_LIST_WIDTH,
      max: Math.max(
        MIN_CONVERSATION_LIST_WIDTH,
        Math.min(MAX_CONVERSATION_LIST_WIDTH, responsiveMaximum)
      )
    };
  }

  function clampConversationListWidth(width: number) {
    const bounds = resizeBounds();
    return Math.min(bounds.max, Math.max(bounds.min, width));
  }

  function resizeFromPointer(clientX: number) {
    const left = inboxRef.current?.getBoundingClientRect().left;
    if (left === undefined) return;
    setConversationListWidth(clampConversationListWidth(clientX - left));
  }

  function handleResizePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    isResizingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeFromPointer(event.clientX);
  }

  function handleResizePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isResizingRef.current) return;
    resizeFromPointer(event.clientX);
  }

  function handleResizePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    isResizingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleResizeKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? KEYBOARD_RESIZE_STEP * 2 : KEYBOARD_RESIZE_STEP;
    let nextWidth: number | null = null;

    if (event.key === "ArrowLeft") nextWidth = conversationListWidth - step;
    if (event.key === "ArrowRight") nextWidth = conversationListWidth + step;
    if (event.key === "Home") nextWidth = resizeBounds().min;
    if (event.key === "End") nextWidth = resizeBounds().max;
    if (nextWidth === null) return;

    event.preventDefault();
    setConversationListWidth(clampConversationListWidth(nextWidth));
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
  }, [refreshConversations, refreshMessages]);

  const inboxStyle = {
    "--conversation-list-width": `${conversationListWidth}px`
  } as CSSProperties;

  return (
    <div
      ref={inboxRef}
      style={inboxStyle}
      className="grid h-[calc(100dvh-11.5rem)] min-h-[36rem] w-full min-w-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-950 lg:grid-cols-[var(--conversation-list-width)_0.75rem_minmax(0,1fr)]"
    >
      <aside className="flex min-w-0 flex-col overflow-hidden border-b border-slate-800 lg:border-b-0">
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
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-5 text-sm text-slate-400">Nenhuma conversa ainda.</div>
          ) : (
            conversations.map((conversation) => {
              const active = conversation.id === selectedId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => selectConversation(conversation.id)}
                  className={`grid w-full min-w-0 max-w-full grid-cols-[1.5rem_minmax(0,1fr)_auto] grid-rows-[auto_auto] items-center gap-x-2 gap-y-1 overflow-hidden border-b px-3 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300 ${
                    active
                      ? "border-cyan-400/60 bg-cyan-400/15 shadow-[inset_3px_0_0_#22d3ee]"
                      : "border-slate-900 bg-slate-950 hover:border-cyan-500/40 hover:bg-slate-800/90"
                  }`}
                >
                  <span className="row-span-2 flex h-6 w-6 items-center justify-center self-center">
                    {conversation.unreadInboundCount > 0 ? (
                      <span
                        aria-label={`${conversation.unreadInboundCount} mensagens não lidas`}
                        className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-cyan-300 px-1.5 text-[11px] font-bold text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.55)] ring-4 ring-cyan-400/15"
                      >
                        {conversation.unreadInboundCount}
                      </span>
                    ) : null}
                  </span>
                  <span
                    title={conversation.businessName}
                    className="min-w-0 truncate text-sm font-semibold text-slate-100"
                  >
                    {conversation.businessName}
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {formatTime(conversation.lastMessageAt)}
                  </span>
                  <span
                    title={conversation.lastMessagePreview ?? conversation.contactPhone}
                    className="col-span-2 col-start-2 min-w-0 truncate text-xs text-slate-300"
                  >
                    {conversation.lastMessagePreview ?? conversation.contactPhone}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <div
        role="separator"
        aria-label="Redimensionar lista de conversas"
        aria-orientation="vertical"
        aria-valuemin={MIN_CONVERSATION_LIST_WIDTH}
        aria-valuemax={Math.round(resizeBounds().max)}
        aria-valuenow={Math.round(conversationListWidth)}
        tabIndex={0}
        onDoubleClick={() => setConversationListWidth(DEFAULT_CONVERSATION_LIST_WIDTH)}
        onKeyDown={handleResizeKeyDown}
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerEnd}
        onPointerCancel={handleResizePointerEnd}
        className="group relative hidden cursor-col-resize touch-none items-center justify-center bg-slate-900 outline-none transition-colors hover:bg-cyan-400/20 focus-visible:bg-cyan-400/20 lg:flex"
      >
        <span className="h-full w-px bg-slate-700 transition-all group-hover:w-1 group-hover:bg-cyan-300 group-focus-visible:w-1 group-focus-visible:bg-cyan-300" />
      </div>

      <section className="flex min-h-[560px] min-w-0 flex-col overflow-hidden">
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

        <div className="min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto bg-slate-950 px-4 py-5">
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
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-800 p-3">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <textarea
              aria-label="Responder à conversa selecionada"
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
