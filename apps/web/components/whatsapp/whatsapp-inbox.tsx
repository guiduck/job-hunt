"use client";

import {
  Bell,
  BellOff,
  RefreshCcw,
  Send,
  Smartphone,
  Wifi,
  WifiOff
} from "lucide-react";
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

function getRealtimeUrl() {
  const configured = process.env.NEXT_PUBLIC_WHATSAPP_REALTIME_URL;
  if (configured) return configured;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
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
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [isSending, startSendTransition] = useTransition();
  const selectedIdRef = useRef(selectedId);
  const unreadRef = useRef(
    new Map(initialConversations.map((conversation) => [
      conversation.id,
      conversation.unreadInboundCount
    ]))
  );
  const inboxRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId]
  );
  const totalUnread = useMemo(
    () => conversations.reduce((total, conversation) => total + conversation.unreadInboundCount, 0),
    [conversations]
  );

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const refreshConversations = useCallback(async (notify = false) => {
    const body = await fetchJson<{ conversations: WhatsAppConversationView[] }>(
      "/api/freelance/whatsapp/conversations"
    );

    if (notify && typeof Notification !== "undefined" && Notification.permission === "granted") {
      for (const conversation of body.conversations) {
        const previousUnread = unreadRef.current.get(conversation.id) ?? 0;
        const isVisibleConversation =
          conversation.id === selectedIdRef.current &&
          document.visibilityState === "visible";
        if (conversation.unreadInboundCount > previousUnread && !isVisibleConversation) {
          const notification = new Notification(
            `Nova mensagem de ${conversation.businessName}`,
            {
              body: conversation.lastMessagePreview ?? "Nova mensagem no WhatsApp",
              tag: `whatsapp-${conversation.id}`
            }
          );
          notification.onclick = () => {
            window.focus();
            setSelectedId(conversation.id);
            notification.close();
          };
        }
      }
    }

    unreadRef.current = new Map(
      body.conversations.map((conversation) => [
        conversation.id,
        conversation.unreadInboundCount
      ])
    );
    setConversations(body.conversations);
    setSelectedId((current) => current ?? body.conversations[0]?.id ?? null);
  }, []);

  const refreshMessages = useCallback(async (
    conversationId: string | null = selectedIdRef.current,
    markRead = false
  ) => {
    if (!conversationId) return;
    const query = markRead ? "?markRead=1" : "";
    const body = await fetchJson<{ messages: WhatsAppMessageView[] }>(
      `/api/freelance/whatsapp/conversations/${conversationId}/messages${query}`
    );
    if (conversationId === selectedIdRef.current) {
      setMessages(body.messages);
    }
    if (markRead) {
      unreadRef.current.set(conversationId, 0);
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, unreadInboundCount: 0 }
            : conversation
        )
      );
    }
  }, []);

  const syncInbox = useCallback(async (notify = false) => {
    await refreshConversations(notify);
    const currentId = selectedIdRef.current;
    if (currentId) {
      const markRead = document.visibilityState === "visible";
      await refreshMessages(currentId, markRead);
      if (markRead) await refreshConversations(false);
    }
  }, [refreshConversations, refreshMessages]);

  function selectConversation(conversationId: string) {
    setSelectedId(conversationId);
    selectedIdRef.current = conversationId;
    setMessages([]);
    setStatus(null);
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

  useEffect(() => {
    if (!selectedId || document.visibilityState !== "visible") return;
    void refreshMessages(selectedId, true).then(() => refreshConversations(false));
  }, [selectedId, refreshConversations, refreshMessages]);

  function sendReply() {
    if (!selectedId || !draft.trim()) return;
    const body = draft.trim();
    startSendTransition(async () => {
      setStatus("Enviando...");
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
        setStatus("Enviada.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "A mensagem nao foi enviada.");
      }
    });
  }

  async function enableNotifications() {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  }

  useEffect(() => {
    setNotificationPermission(
      typeof Notification === "undefined" ? "unsupported" : Notification.permission
    );
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = totalUnread > 0
      ? `(${totalUnread}) WhatsApp | Opportunity Desk`
      : previousTitle.replace(/^\(\d+\)\s*/, "");
    return () => {
      document.title = previousTitle;
    };
  }, [totalUnread]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let stopped = false;
    let retryDelay = 1000;

    const connect = () => {
      if (stopped) return;
      socket = new WebSocket(getRealtimeUrl());
      socket.onopen = () => {
        retryDelay = 1000;
        setRealtimeConnected(true);
      };
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as { type?: string };
          if (payload.type === "whatsapp.updated") {
            void syncInbox(true);
          }
        } catch {
          // Ignore malformed realtime control messages.
        }
      };
      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        setRealtimeConnected(false);
        if (stopped) return;
        reconnectTimer = window.setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30_000);
      };
    };

    connect();
    const fallbackTimer = window.setInterval(() => {
      void syncInbox(true);
    }, 30_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void syncInbox(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopped = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      window.clearInterval(fallbackTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      socket?.close();
    };
  }, [syncInbox]);

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
            {totalUnread > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1.5 text-[11px] font-semibold text-slate-950">
                {totalUnread}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <span
              className={realtimeConnected ? "text-emerald-400" : "text-amber-400"}
              title={realtimeConnected ? "Tempo real conectado" : "Reconectando tempo real"}
            >
              {realtimeConnected ? (
                <Wifi className="h-4 w-4" aria-hidden="true" />
              ) : (
                <WifiOff className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            <Button
              aria-label="Ativar notificacoes"
              title={
                notificationPermission === "granted"
                  ? "Notificacoes ativadas"
                  : "Ativar notificacoes"
              }
              size="icon"
              variant="ghost"
              onClick={() => void enableNotifications()}
              disabled={notificationPermission === "granted"}
            >
              {notificationPermission === "granted" ? (
                <Bell className="h-4 w-4" aria-hidden="true" />
              ) : (
                <BellOff className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            <Button
              aria-label="Atualizar conversas"
              title="Atualizar conversas"
              size="icon"
              variant="ghost"
              onClick={() => void syncInbox(false)}
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
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
