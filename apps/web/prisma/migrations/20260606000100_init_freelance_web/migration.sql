CREATE TYPE "MarketScope" AS ENUM ('BR', 'INTERNATIONAL');
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'ready', 'collecting', 'paused', 'completed', 'failed', 'archived');
CREATE TYPE "ProspectingJobStatus" AS ENUM ('pending', 'running', 'completed', 'completed_no_results', 'failed', 'cancelled');
CREATE TYPE "ProspectingJobStep" AS ENUM ('queued', 'discovering_businesses', 'normalizing_results', 'deduplicating', 'fetching_websites', 'analyzing_websites', 'scoring_leads', 'saving_leads', 'done');
CREATE TYPE "WebsiteStatus" AS ENUM ('no_site', 'social_only', 'linktree', 'aggregator', 'broken', 'weak_site', 'usable_site', 'uncertain');
CREATE TYPE "LeadTemperature" AS ENUM ('cold', 'warm', 'hot');
CREATE TYPE "CommercialStatus" AS ENUM ('new', 'contacted', 'interested', 'proposal_requested', 'proposal_sent', 'won', 'lost', 'ignored');
CREATE TYPE "TemplateStage" AS ENUM ('first_contact', 'follow_up');
CREATE TYPE "GeneratedTextKind" AS ENUM ('lovable_prompt', 'commercial_message');

CREATE TABLE "freelance_niches" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "market" TEXT NOT NULL DEFAULT 'both',
  "conversion_hint" DECIMAL(5,2),
  "default_query_terms" JSONB NOT NULL DEFAULT '[]',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "freelance_niches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "freelance_campaigns" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "market_scope" "MarketScope" NOT NULL,
  "country" TEXT NOT NULL,
  "region" TEXT,
  "state" TEXT,
  "city" TEXT NOT NULL,
  "niche_id" TEXT NOT NULL,
  "niche_name_snapshot" TEXT NOT NULL,
  "conversion_hint_snapshot" DECIMAL(5,2),
  "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
  "search_settings" JSONB NOT NULL DEFAULT '{}',
  "lead_count" INTEGER NOT NULL DEFAULT 0,
  "hot_lead_count" INTEGER NOT NULL DEFAULT 0,
  "contacted_count" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "last_run_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "archived_at" TIMESTAMP(3),
  CONSTRAINT "freelance_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prospecting_jobs" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "status" "ProspectingJobStatus" NOT NULL DEFAULT 'pending',
  "current_step" "ProspectingJobStep" NOT NULL DEFAULT 'queued',
  "provider_name" TEXT NOT NULL,
  "provider_run_id" TEXT,
  "source_query" TEXT NOT NULL,
  "requested_max_results" INTEGER NOT NULL DEFAULT 50,
  "inspected_count" INTEGER NOT NULL DEFAULT 0,
  "accepted_count" INTEGER NOT NULL DEFAULT 0,
  "duplicate_count" INTEGER NOT NULL DEFAULT 0,
  "rejected_count" INTEGER NOT NULL DEFAULT 0,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "provider_status" TEXT NOT NULL DEFAULT 'pending',
  "provider_error_code" TEXT,
  "provider_error_message" TEXT,
  "diagnostics" JSONB NOT NULL DEFAULT '{}',
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "prospecting_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "freelance_leads" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "job_id" TEXT,
  "niche_id" TEXT,
  "business_name" TEXT NOT NULL,
  "category" TEXT,
  "country" TEXT NOT NULL,
  "region" TEXT,
  "state" TEXT,
  "city" TEXT NOT NULL,
  "address" TEXT,
  "phone" TEXT,
  "whatsapp" TEXT,
  "email" TEXT,
  "website_url" TEXT,
  "website_status" "WebsiteStatus" NOT NULL DEFAULT 'uncertain',
  "source_name" TEXT NOT NULL,
  "source_url" TEXT,
  "source_query" TEXT NOT NULL,
  "source_identifier" TEXT,
  "source_evidence" TEXT NOT NULL,
  "google_rating" DECIMAL(3,2),
  "google_review_count" INTEGER,
  "lead_score" INTEGER NOT NULL DEFAULT 0,
  "content_score" INTEGER,
  "design_score" INTEGER,
  "performance_score" INTEGER,
  "seo_score" INTEGER,
  "temperature" "LeadTemperature" NOT NULL DEFAULT 'cold',
  "commercial_status" "CommercialStatus" NOT NULL DEFAULT 'new',
  "classification_reasons" JSONB NOT NULL DEFAULT '[]',
  "demo_url" TEXT,
  "operator_notes" TEXT,
  "last_generated_prompt_id" TEXT,
  "last_generated_message_id" TEXT,
  "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "freelance_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "website_analyses" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "requested_url" TEXT NOT NULL,
  "final_url" TEXT,
  "http_status" INTEGER,
  "reachable" BOOLEAN NOT NULL DEFAULT false,
  "https_enabled" BOOLEAN NOT NULL DEFAULT false,
  "redirected" BOOLEAN NOT NULL DEFAULT false,
  "detected_status" "WebsiteStatus" NOT NULL,
  "title" TEXT,
  "meta_description" TEXT,
  "headings" JSONB NOT NULL DEFAULT '[]',
  "cta_texts" JSONB NOT NULL DEFAULT '[]',
  "phone_signals" JSONB NOT NULL DEFAULT '[]',
  "whatsapp_signals" JSONB NOT NULL DEFAULT '[]',
  "email_signals" JSONB NOT NULL DEFAULT '[]',
  "form_detected" BOOLEAN NOT NULL DEFAULT false,
  "local_service_text_detected" BOOLEAN NOT NULL DEFAULT false,
  "social_only_detected" BOOLEAN NOT NULL DEFAULT false,
  "linktree_detected" BOOLEAN NOT NULL DEFAULT false,
  "aggregator_detected" BOOLEAN NOT NULL DEFAULT false,
  "broken_reason" TEXT,
  "basic_performance_evidence" JSONB NOT NULL DEFAULT '{}',
  "basic_seo_evidence" JSONB NOT NULL DEFAULT '{}',
  "content_score" INTEGER,
  "design_score" INTEGER,
  "performance_score" INTEGER,
  "seo_score" INTEGER,
  "overall_opportunity_score" INTEGER,
  "evidence_points" JSONB NOT NULL DEFAULT '[]',
  "analyzed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "website_analyses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commercial_templates" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "name" TEXT NOT NULL,
  "stage" "TemplateStage" NOT NULL,
  "category" TEXT,
  "channel" TEXT NOT NULL DEFAULT 'any',
  "body_template" TEXT NOT NULL,
  "variables_schema" JSONB NOT NULL DEFAULT '{}',
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "commercial_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seller_settings" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "default_market_scope" "MarketScope" NOT NULL DEFAULT 'BR',
  "seller_name" TEXT,
  "seller_title" TEXT,
  "seller_email" TEXT,
  "seller_whatsapp" TEXT,
  "portfolio_url" TEXT,
  "default_country" TEXT,
  "default_currency" TEXT,
  "offer_title" TEXT,
  "offer_description" TEXT,
  "landing_page_price" DECIMAL(10,2),
  "installments" INTEGER,
  "delivery_time" TEXT,
  "preferred_niche_ids" JSONB NOT NULL DEFAULT '[]',
  "extra_context" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "seller_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "latest_generated_texts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "kind" "GeneratedTextKind" NOT NULL,
  "variant" TEXT NOT NULL,
  "template_id" TEXT,
  "stage" "TemplateStage",
  "text" TEXT NOT NULL,
  "input_context" JSONB NOT NULL DEFAULT '{}',
  "copied_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "latest_generated_texts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "freelance_niches_slug_key" ON "freelance_niches"("slug");
CREATE INDEX "freelance_campaigns_user_id_status_idx" ON "freelance_campaigns"("user_id", "status");
CREATE INDEX "freelance_campaigns_niche_id_idx" ON "freelance_campaigns"("niche_id");
CREATE INDEX "prospecting_jobs_user_id_status_idx" ON "prospecting_jobs"("user_id", "status");
CREATE INDEX "prospecting_jobs_campaign_id_status_idx" ON "prospecting_jobs"("campaign_id", "status");
CREATE INDEX "freelance_leads_user_id_commercial_status_idx" ON "freelance_leads"("user_id", "commercial_status");
CREATE INDEX "freelance_leads_campaign_id_idx" ON "freelance_leads"("campaign_id");
CREATE INDEX "freelance_leads_website_status_idx" ON "freelance_leads"("website_status");
CREATE INDEX "website_analyses_user_id_lead_id_idx" ON "website_analyses"("user_id", "lead_id");
CREATE INDEX "commercial_templates_user_id_stage_is_active_idx" ON "commercial_templates"("user_id", "stage", "is_active");
CREATE UNIQUE INDEX "seller_settings_user_id_key" ON "seller_settings"("user_id");
CREATE INDEX "latest_generated_texts_user_id_lead_id_kind_idx" ON "latest_generated_texts"("user_id", "lead_id", "kind");
CREATE UNIQUE INDEX "latest_generated_texts_lead_id_kind_variant_stage_key" ON "latest_generated_texts"("lead_id", "kind", "variant", "stage");

ALTER TABLE "freelance_campaigns" ADD CONSTRAINT "freelance_campaigns_niche_id_fkey" FOREIGN KEY ("niche_id") REFERENCES "freelance_niches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prospecting_jobs" ADD CONSTRAINT "prospecting_jobs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "freelance_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "freelance_leads" ADD CONSTRAINT "freelance_leads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "freelance_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "freelance_leads" ADD CONSTRAINT "freelance_leads_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "prospecting_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "freelance_leads" ADD CONSTRAINT "freelance_leads_niche_id_fkey" FOREIGN KEY ("niche_id") REFERENCES "freelance_niches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "website_analyses" ADD CONSTRAINT "website_analyses_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "freelance_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "latest_generated_texts" ADD CONSTRAINT "latest_generated_texts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "freelance_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "latest_generated_texts" ADD CONSTRAINT "latest_generated_texts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "commercial_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
