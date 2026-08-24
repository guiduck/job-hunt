import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { OwnerScope } from "./repositories";

const WHATSAPP_PREFIX = "whatsapp:";

type TwilioInboundPayload = {
  MessageSid?: string;
  SmsMessageSid?: string;
  From?: string;
  To?: string;
  Body?: string;
  ProfileName?: string;
  WaId?: string;
  SmsStatus?: string;
  MessageStatus?: string;
};

export type WhatsAppConversationView = {
  id: string;
  leadId: string | null;
  businessName: string;
  contactPhone: string;
  contactName: string | null;
  status: string;
  lastMessagePreview: string | null;
  lastMessageDirection: "inbound" | "outbound" | null;
  lastMessageAt: string | null;
  unreadInboundCount: number;
};

export type WhatsAppMessageView = {
  id: string;
  direction: "inbound" | "outbound";
  fromPhone: string;
  toPhone: string;
  body: string;
  providerMessageId: string | null;
  providerStatus: string | null;
  occurredAt: string;
};

export function normalizeWhatsAppAddress(value?: string | null) {
  if (!value) return "";
  const withoutPrefix = value.trim().toLowerCase().startsWith(WHATSAPP_PREFIX)
    ? value.trim().slice(WHATSAPP_PREFIX.length)
    : value.trim();
  const normalized = withoutPrefix.replace(/[()\s-]/g, "");
  return normalized.startsWith("+") ? normalized : normalized ? `+${normalized}` : "";
}

function fallbackOwnerUserId() {
  return process.env.DEFAULT_FREELANCE_USER_ID || "local-operator";
}

function preview(body: string) {
  return body.replace(/\s+/g, " ").trim().slice(0, 240);
}

function possiblePhoneValues(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return Array.from(new Set([phone, digits, digits ? `+${digits}` : ""].filter(Boolean)));
}

async function findLeadForPhone(userId: string, phone: string) {
  const values = possiblePhoneValues(phone);
  return prisma.freelanceLead.findFirst({
    where: {
      userId,
      OR: [{ whatsapp: { in: values } }, { phone: { in: values } }]
    },
    orderBy: { updatedAt: "desc" }
  });
}

async function findConversationLead(userId: string, leadId: string | null, contactPhone: string) {
  if (leadId) {
    const lead = await prisma.freelanceLead.findFirst({ where: { id: leadId, userId } });
    if (lead) return lead;
  }
  return findLeadForPhone(userId, contactPhone);
}

export function isValidTwilioWebhookSignature(input: {
  url: string;
  params: Record<string, string>;
  signature: string | null;
  authToken?: string;
}) {
  if (process.env.TWILIO_DISABLE_WEBHOOK_VALIDATION === "true") return true;
  if (!input.authToken || !input.signature) return false;
  const sorted = Object.keys(input.params)
    .sort()
    .map((key) => `${key}${input.params[key]}`)
    .join("");
  const expected = crypto
    .createHmac("sha1", input.authToken)
    .update(`${input.url}${sorted}`)
    .digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(input.signature);
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function recordInboundTwilioWhatsAppMessage(payload: TwilioInboundPayload) {
  const fromPhone = normalizeWhatsAppAddress(payload.From);
  const toPhone = normalizeWhatsAppAddress(payload.To);
  const body = payload.Body?.trim() || "";
  if (!fromPhone || !toPhone || !body) {
    throw new Error("Inbound WhatsApp webhook is missing From, To, or Body.");
  }

  const providerMessageId = payload.MessageSid ?? payload.SmsMessageSid ?? null;
  if (providerMessageId) {
    const existing = await prisma.whatsAppMessage.findUnique({
      where: { providerName_providerMessageId: { providerName: "twilio", providerMessageId } }
    });
    if (existing) return existing;
  }

  const userId = fallbackOwnerUserId();
  const lead = await findLeadForPhone(userId, fromPhone);
  const contactName = payload.ProfileName || lead?.businessName || null;
  const conversation = await prisma.whatsAppConversation.upsert({
    where: { userId_contactPhone: { userId, contactPhone: fromPhone } },
    create: {
      userId,
      leadId: lead?.id,
      contactPhone: fromPhone,
      contactName,
      lastMessagePreview: preview(body),
      lastMessageDirection: "inbound",
      lastMessageAt: new Date(),
      unreadInboundCount: 1
    },
    update: {
      leadId: lead?.id,
      contactName,
      lastMessagePreview: preview(body),
      lastMessageDirection: "inbound",
      lastMessageAt: new Date(),
      unreadInboundCount: { increment: 1 },
      status: "open"
    }
  });

  return prisma.whatsAppMessage.create({
    data: {
      userId,
      conversationId: conversation.id,
      leadId: lead?.id,
      direction: "inbound",
      fromPhone,
      toPhone,
      body,
      providerName: "twilio",
      providerMessageId,
      providerStatus: payload.MessageStatus ?? payload.SmsStatus,
      payload: payload as Prisma.InputJsonObject
    }
  });
}

export async function recordOutboundWhatsAppMessage(input: {
  userId: string;
  leadId?: string | null;
  to: string;
  from: string;
  body: string;
  providerMessageId?: string;
  providerStatus?: string;
  payload?: Record<string, unknown>;
}) {
  const contactPhone = normalizeWhatsAppAddress(input.to);
  const fromPhone = normalizeWhatsAppAddress(input.from);
  if (!contactPhone || !fromPhone || !input.body.trim()) return null;

  if (input.providerMessageId) {
    const existing = await prisma.whatsAppMessage.findUnique({
      where: {
        providerName_providerMessageId: {
          providerName: "twilio",
          providerMessageId: input.providerMessageId
        }
      }
    });
    if (existing) return existing;
  }

  const lead = await findConversationLead(input.userId, input.leadId ?? null, contactPhone);
  const conversation = await prisma.whatsAppConversation.upsert({
    where: { userId_contactPhone: { userId: input.userId, contactPhone } },
    create: {
      userId: input.userId,
      leadId: lead?.id,
      contactPhone,
      contactName: lead?.businessName,
      lastMessagePreview: preview(input.body),
      lastMessageDirection: "outbound",
      lastMessageAt: new Date()
    },
    update: {
      leadId: lead?.id,
      contactName: lead?.businessName,
      lastMessagePreview: preview(input.body),
      lastMessageDirection: "outbound",
      lastMessageAt: new Date(),
      status: "open"
    }
  });

  return prisma.whatsAppMessage.create({
    data: {
      userId: input.userId,
      conversationId: conversation.id,
      leadId: lead?.id,
      direction: "outbound",
      fromPhone,
      toPhone: contactPhone,
      body: input.body.trim(),
      providerName: "twilio",
      providerMessageId: input.providerMessageId,
      providerStatus: input.providerStatus,
      payload: (input.payload ?? {}) as Prisma.InputJsonObject
    }
  });
}

export async function listWhatsAppConversations(scope: OwnerScope): Promise<WhatsAppConversationView[]> {
  const conversations = await prisma.whatsAppConversation.findMany({
    where: { userId: scope.userId, status: "open" },
    include: { lead: { select: { id: true, businessName: true } } },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    take: 100
  });
  return conversations.map((conversation) => ({
    id: conversation.id,
    leadId: conversation.leadId,
    businessName: conversation.lead?.businessName ?? conversation.contactName ?? conversation.contactPhone,
    contactPhone: conversation.contactPhone,
    contactName: conversation.contactName,
    status: conversation.status,
    lastMessagePreview: conversation.lastMessagePreview,
    lastMessageDirection: conversation.lastMessageDirection,
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    unreadInboundCount: conversation.unreadInboundCount
  }));
}

export async function listWhatsAppMessages(scope: OwnerScope, conversationId: string): Promise<WhatsAppMessageView[]> {
  const conversation = await prisma.whatsAppConversation.findFirst({
    where: { id: conversationId, userId: scope.userId },
    select: { id: true }
  });
  if (!conversation) return [];
  const messages = await prisma.whatsAppMessage.findMany({
    where: { conversationId, userId: scope.userId },
    orderBy: { occurredAt: "asc" },
    take: 200
  });
  return messages.map((message) => ({
    id: message.id,
    direction: message.direction,
    fromPhone: message.fromPhone,
    toPhone: message.toPhone,
    body: message.body,
    providerMessageId: message.providerMessageId,
    providerStatus: message.providerStatus,
    occurredAt: message.occurredAt.toISOString()
  }));
}

export async function markWhatsAppConversationRead(scope: OwnerScope, conversationId: string) {
  await prisma.whatsAppConversation.updateMany({
    where: { id: conversationId, userId: scope.userId },
    data: { unreadInboundCount: 0 }
  });
}

export async function getWhatsAppConversation(scope: OwnerScope, conversationId: string) {
  return prisma.whatsAppConversation.findFirst({
    where: { id: conversationId, userId: scope.userId },
    include: { lead: true }
  });
}