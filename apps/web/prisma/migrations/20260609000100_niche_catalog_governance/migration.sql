CREATE TYPE "NicheLifecycleStatus" AS ENUM ('approved', 'disabled', 'merged');
CREATE TYPE "NicheCandidateStatus" AS ENUM ('proposed', 'approved', 'rejected', 'deferred', 'already_covered');
CREATE TYPE "NicheAuditSeverity" AS ENUM ('info', 'warning', 'blocking');
CREATE TYPE "NicheAuditStatus" AS ENUM ('passed', 'warnings', 'failed');

ALTER TABLE "freelance_niches"
  ADD COLUMN "display_name" TEXT,
  ADD COLUMN "source_name" TEXT,
  ADD COLUMN "source_path" TEXT,
  ADD COLUMN "source_note" TEXT,
  ADD COLUMN "conversion_hint_source" TEXT,
  ADD COLUMN "aliases" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "query_terms" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "market_applicability" TEXT NOT NULL DEFAULT 'both',
  ADD COLUMN "lifecycle_status" "NicheLifecycleStatus" NOT NULL DEFAULT 'approved',
  ADD COLUMN "merged_into_niche_id" TEXT,
  ADD COLUMN "last_audited_at" TIMESTAMP(3);

UPDATE "freelance_niches"
SET
  "display_name" = COALESCE("display_name", "name"),
  "source_name" = COALESCE("source_name", "name"),
  "source_path" = COALESCE("source_path", 'apps/web/prisma/seed-data/niches.ts'),
  "source_note" = COALESCE("source_note", 'Initial seed baseline'),
  "conversion_hint_source" = COALESCE("conversion_hint_source", 'text_seed'),
  "query_terms" = CASE
    WHEN jsonb_array_length("query_terms") = 0 THEN "default_query_terms"
    ELSE "query_terms"
  END,
  "market_applicability" = COALESCE(NULLIF("market", ''), 'both');

ALTER TABLE "freelance_niches"
  ADD CONSTRAINT "freelance_niches_merged_into_niche_id_fkey"
  FOREIGN KEY ("merged_into_niche_id") REFERENCES "freelance_niches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "freelance_niches_enabled_lifecycle_status_idx"
  ON "freelance_niches"("enabled", "lifecycle_status");
CREATE INDEX "freelance_niches_market_applicability_idx"
  ON "freelance_niches"("market_applicability");

CREATE TABLE "niche_candidates" (
  "id" TEXT NOT NULL,
  "proposed_name" TEXT NOT NULL,
  "normalized_name" TEXT NOT NULL,
  "proposed_slug" TEXT NOT NULL,
  "market_applicability" TEXT NOT NULL DEFAULT 'both',
  "proposed_conversion_hint" DECIMAL(5,2),
  "proposed_query_terms" JSONB NOT NULL DEFAULT '[]',
  "source_path" TEXT NOT NULL,
  "source_excerpt" TEXT,
  "source_note" TEXT,
  "status" "NicheCandidateStatus" NOT NULL DEFAULT 'proposed',
  "matched_niche_id" TEXT,
  "decision_reason" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "niche_candidates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "niche_candidates_matched_niche_id_fkey"
    FOREIGN KEY ("matched_niche_id") REFERENCES "freelance_niches"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "niche_candidates_status_market_applicability_idx"
  ON "niche_candidates"("status", "market_applicability");
CREATE INDEX "niche_candidates_proposed_slug_idx"
  ON "niche_candidates"("proposed_slug");

CREATE TABLE "niche_audit_runs" (
  "id" TEXT NOT NULL,
  "status" "NicheAuditStatus" NOT NULL,
  "baseline_count" INTEGER NOT NULL,
  "approved_count" INTEGER NOT NULL,
  "candidate_count" INTEGER NOT NULL DEFAULT 0,
  "missing_count" INTEGER NOT NULL DEFAULT 0,
  "extra_count" INTEGER NOT NULL DEFAULT 0,
  "duplicate_count" INTEGER NOT NULL DEFAULT 0,
  "encoding_issue_count" INTEGER NOT NULL DEFAULT 0,
  "conversion_mismatch_count" INTEGER NOT NULL DEFAULT 0,
  "source_summary" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "niche_audit_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "niche_audit_runs_status_created_at_idx"
  ON "niche_audit_runs"("status", "created_at");

CREATE TABLE "niche_audit_findings" (
  "id" TEXT NOT NULL,
  "run_id" TEXT NOT NULL,
  "severity" "NicheAuditSeverity" NOT NULL,
  "finding_type" TEXT NOT NULL,
  "niche_id" TEXT,
  "candidate_id" TEXT,
  "reference_name" TEXT,
  "current_name" TEXT,
  "expected_value" TEXT,
  "current_value" TEXT,
  "message" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "niche_audit_findings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "niche_audit_findings_run_id_fkey"
    FOREIGN KEY ("run_id") REFERENCES "niche_audit_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "niche_audit_findings_niche_id_fkey"
    FOREIGN KEY ("niche_id") REFERENCES "freelance_niches"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "niche_audit_findings_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "niche_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "niche_audit_findings_run_id_severity_idx"
  ON "niche_audit_findings"("run_id", "severity");
CREATE INDEX "niche_audit_findings_finding_type_idx"
  ON "niche_audit_findings"("finding_type");
