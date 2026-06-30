CREATE TYPE "OutreachChannel" AS ENUM ('email', 'whatsapp');

CREATE TYPE "BulkOutreachBatchStatus" AS ENUM (
  'draft',
  'queued',
  'running',
  'completed',
  'failed',
  'approved',
  'partially_sent',
  'sent'
);

CREATE TYPE "BulkOutreachItemStatus" AS ENUM (
  'queued',
  'generating',
  'generated',
  'generation_failed',
  'missing_contact',
  'invalid_contact',
  'duplicate_blocked',
  'skipped',
  'approved',
  'sending',
  'sent',
  'failed_send'
);

CREATE TYPE "OutreachEventType" AS ENUM (
  'generated',
  'generation_failed',
  'item_updated',
  'skipped',
  'unskipped',
  'approved',
  'queued_send',
  'sent',
  'failed_send',
  'blocked_missing_contact',
  'blocked_invalid_contact',
  'blocked_duplicate',
  'blocked_channel_not_ready',
  'blocked_rate_limit'
);

CREATE TYPE "ChannelReadinessStatus" AS ENUM (
  'ready',
  'missing_config',
  'missing_credentials',
  'not_approved',
  'missing_template',
  'missing_opt_in',
  'rate_limited',
  'provider_error',
  'disabled'
);

CREATE TABLE "bulk_outreach_batches" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "channel" "OutreachChannel" NOT NULL,
  "campaign_id" TEXT,
  "template_id" TEXT,
  "stage" "TemplateStage" NOT NULL DEFAULT 'first_contact',
  "status" "BulkOutreachBatchStatus" NOT NULL DEFAULT 'draft',
  "selected_count" INTEGER NOT NULL DEFAULT 0,
  "eligible_count" INTEGER NOT NULL DEFAULT 0,
  "missing_contact_count" INTEGER NOT NULL DEFAULT 0,
  "invalid_contact_count" INTEGER NOT NULL DEFAULT 0,
  "duplicate_count" INTEGER NOT NULL DEFAULT 0,
  "generated_count" INTEGER NOT NULL DEFAULT 0,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "skipped_count" INTEGER NOT NULL DEFAULT 0,
  "approved_count" INTEGER NOT NULL DEFAULT 0,
  "sent_count" INTEGER NOT NULL DEFAULT 0,
  "failed_send_count" INTEGER NOT NULL DEFAULT 0,
  "channel_limit_snapshot" JSONB NOT NULL DEFAULT '{}',
  "generation_context_snapshot" JSONB NOT NULL DEFAULT '{}',
  "diagnostics" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "generated_at" TIMESTAMP(3),
  "approved_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),

  CONSTRAINT "bulk_outreach_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bulk_outreach_items" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "batch_id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "campaign_id" TEXT,
  "channel" "OutreachChannel" NOT NULL,
  "status" "BulkOutreachItemStatus" NOT NULL DEFAULT 'queued',
  "contact_source" TEXT NOT NULL DEFAULT 'lead_existing',
  "recipient_email" TEXT,
  "recipient_phone" TEXT,
  "recipient_whatsapp" TEXT,
  "subject" TEXT,
  "body" TEXT,
  "message" TEXT,
  "template_id" TEXT,
  "generation_input_context" JSONB NOT NULL DEFAULT '{}',
  "generation_error_code" TEXT,
  "generation_error_message" TEXT,
  "validation_error_code" TEXT,
  "validation_error_message" TEXT,
  "duplicate_of_event_id" TEXT,
  "skip_reason" TEXT,
  "operator_edited_at" TIMESTAMP(3),
  "approved_at" TIMESTAMP(3),
  "sent_at" TIMESTAMP(3),
  "provider_name" TEXT,
  "provider_message_id" TEXT,
  "provider_status" TEXT,
  "provider_error_code" TEXT,
  "provider_error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "bulk_outreach_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outreach_channel_settings" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "channel" "OutreachChannel" NOT NULL,
  "provider_name" TEXT NOT NULL,
  "display_name" TEXT,
  "display_address" TEXT,
  "status" "ChannelReadinessStatus" NOT NULL DEFAULT 'disabled',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "daily_limit" INTEGER,
  "remaining_today" INTEGER,
  "limit_reset_at" TIMESTAMP(3),
  "required_env_vars" JSONB NOT NULL DEFAULT '[]',
  "missing_env_vars" JSONB NOT NULL DEFAULT '[]',
  "diagnostic_code" TEXT,
  "diagnostic_message" TEXT,
  "last_checked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "outreach_channel_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outreach_events" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "batch_id" TEXT,
  "item_id" TEXT,
  "lead_id" TEXT NOT NULL,
  "campaign_id" TEXT,
  "channel" "OutreachChannel" NOT NULL,
  "stage" "TemplateStage" NOT NULL DEFAULT 'first_contact',
  "event_type" "OutreachEventType" NOT NULL,
  "provider_name" TEXT,
  "provider_message_id" TEXT,
  "recipient" TEXT,
  "subject" TEXT,
  "status" TEXT NOT NULL,
  "diagnostic_code" TEXT,
  "diagnostic_message" TEXT,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "outreach_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bulk_outreach_batches_user_id_status_idx" ON "bulk_outreach_batches"("user_id", "status");
CREATE INDEX "bulk_outreach_batches_user_id_channel_stage_idx" ON "bulk_outreach_batches"("user_id", "channel", "stage");
CREATE INDEX "bulk_outreach_batches_campaign_id_idx" ON "bulk_outreach_batches"("campaign_id");

CREATE INDEX "bulk_outreach_items_user_id_batch_id_idx" ON "bulk_outreach_items"("user_id", "batch_id");
CREATE INDEX "bulk_outreach_items_user_id_lead_id_channel_status_idx" ON "bulk_outreach_items"("user_id", "lead_id", "channel", "status");
CREATE INDEX "bulk_outreach_items_campaign_id_channel_idx" ON "bulk_outreach_items"("campaign_id", "channel");

CREATE UNIQUE INDEX "outreach_channel_settings_user_id_channel_key" ON "outreach_channel_settings"("user_id", "channel");
CREATE INDEX "outreach_channel_settings_user_id_status_idx" ON "outreach_channel_settings"("user_id", "status");

CREATE INDEX "outreach_events_user_id_lead_id_channel_stage_idx" ON "outreach_events"("user_id", "lead_id", "channel", "stage");
CREATE INDEX "outreach_events_user_id_batch_id_idx" ON "outreach_events"("user_id", "batch_id");
CREATE INDEX "outreach_events_campaign_id_channel_idx" ON "outreach_events"("campaign_id", "channel");
CREATE INDEX "outreach_events_event_type_occurred_at_idx" ON "outreach_events"("event_type", "occurred_at");

ALTER TABLE "bulk_outreach_batches"
  ADD CONSTRAINT "bulk_outreach_batches_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "freelance_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bulk_outreach_batches"
  ADD CONSTRAINT "bulk_outreach_batches_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "commercial_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bulk_outreach_items"
  ADD CONSTRAINT "bulk_outreach_items_batch_id_fkey"
  FOREIGN KEY ("batch_id") REFERENCES "bulk_outreach_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bulk_outreach_items"
  ADD CONSTRAINT "bulk_outreach_items_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "freelance_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bulk_outreach_items"
  ADD CONSTRAINT "bulk_outreach_items_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "freelance_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bulk_outreach_items"
  ADD CONSTRAINT "bulk_outreach_items_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "commercial_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bulk_outreach_items"
  ADD CONSTRAINT "bulk_outreach_items_duplicate_of_event_id_fkey"
  FOREIGN KEY ("duplicate_of_event_id") REFERENCES "outreach_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "outreach_events"
  ADD CONSTRAINT "outreach_events_batch_id_fkey"
  FOREIGN KEY ("batch_id") REFERENCES "bulk_outreach_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "outreach_events"
  ADD CONSTRAINT "outreach_events_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "bulk_outreach_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "outreach_events"
  ADD CONSTRAINT "outreach_events_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "freelance_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "outreach_events"
  ADD CONSTRAINT "outreach_events_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "freelance_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
