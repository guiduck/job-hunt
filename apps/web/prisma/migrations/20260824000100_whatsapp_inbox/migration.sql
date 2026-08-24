CREATE TYPE "WhatsAppConversationStatus" AS ENUM ('open', 'archived');
CREATE TYPE "WhatsAppMessageDirection" AS ENUM ('inbound', 'outbound');

CREATE TABLE "whatsapp_conversations" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "lead_id" TEXT,
  "contact_phone" TEXT NOT NULL,
  "contact_name" TEXT,
  "status" "WhatsAppConversationStatus" NOT NULL DEFAULT 'open',
  "last_message_preview" TEXT,
  "last_message_direction" "WhatsAppMessageDirection",
  "last_message_at" TIMESTAMP(3),
  "unread_inbound_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whatsapp_messages" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "lead_id" TEXT,
  "direction" "WhatsAppMessageDirection" NOT NULL,
  "from_phone" TEXT NOT NULL,
  "to_phone" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "provider_name" TEXT NOT NULL DEFAULT 'twilio',
  "provider_message_id" TEXT,
  "provider_status" TEXT,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whatsapp_conversations_user_id_contact_phone_key" ON "whatsapp_conversations"("user_id", "contact_phone");
CREATE INDEX "whatsapp_conversations_user_id_status_last_message_at_idx" ON "whatsapp_conversations"("user_id", "status", "last_message_at");
CREATE INDEX "whatsapp_conversations_lead_id_idx" ON "whatsapp_conversations"("lead_id");

CREATE UNIQUE INDEX "whatsapp_messages_provider_name_provider_message_id_key" ON "whatsapp_messages"("provider_name", "provider_message_id");
CREATE INDEX "whatsapp_messages_user_id_occurred_at_idx" ON "whatsapp_messages"("user_id", "occurred_at");
CREATE INDEX "whatsapp_messages_conversation_id_occurred_at_idx" ON "whatsapp_messages"("conversation_id", "occurred_at");
CREATE INDEX "whatsapp_messages_lead_id_idx" ON "whatsapp_messages"("lead_id");

ALTER TABLE "whatsapp_conversations"
  ADD CONSTRAINT "whatsapp_conversations_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "freelance_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "whatsapp_messages"
  ADD CONSTRAINT "whatsapp_messages_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "whatsapp_messages"
  ADD CONSTRAINT "whatsapp_messages_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "freelance_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;