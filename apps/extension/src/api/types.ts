export type JobStage = "new" | "saved" | "applied" | "responded" | "interview" | "rejected" | "ignored"

export type CurrentUser = {
  id: string
  email: string
  display_name: string
  subscription_status: string
  subscription_plan: string
  created_at: string
  updated_at: string
}

export type AuthSessionResponse = {
  access_token: string
  token_type: "bearer"
  user: CurrentUser
}

export type RegisterRequest = {
  email: string
  password: string
  display_name: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type PasswordResetRequest = {
  email: string
}

export type PasswordResetConfirmRequest = {
  token: string
  password: string
}

export type JobReviewStatus = "unreviewed" | "reviewing" | "saved" | "ignored"

export type AnalysisStatus = "deterministic_only" | "ai_assisted" | "fallback" | "failed" | "skipped"

export type JobSearchRunStatus = "pending" | "running" | "completed" | "completed_no_results" | "failed"

export type LinkedInCollectionSourceType = "authenticated_browser_search"

export type JobReviewProfile = {
  review_status: JobReviewStatus
  match_score: number | null
  score_explanation: string | null
  score_factors: Record<string, unknown>
  analysis_status: AnalysisStatus
  analysis_confidence: string | null
  analysis_error_code: string | null
  analysis_error_message: string | null
  normalized_company_name: string | null
  normalized_role_title: string | null
  detected_seniority: string | null
  detected_modality: string | null
  detected_location: string | null
  missing_keywords: string[]
  historical_similarity_signals: Record<string, unknown>
}

export type JobDetail = {
  id: string
  opportunity_id: string
  company_name: string | null
  role_title: string | null
  post_headline: string | null
  job_description: string | null
  contact_channel_type: string
  contact_channel_value: string
  contact_email: string | null
  application_url: string | null
  linkedin_url: string | null
  poster_profile_url: string | null
  contact_priority: string | null
  hiring_intent_term: string | null
  collection_source_type: string | null
  matched_keywords: string[]
  dedupe_key: string | null
  job_stage: JobStage
  review_profile: JobReviewProfile | null
}

export type Opportunity = {
  id: string
  opportunity_type: "job" | "freelance"
  title: string | null
  organization_name: string | null
  source_name: string | null
  source_url: string | null
  source_query: string | null
  source_evidence: string
  operator_notes: string | null
  captured_at: string
  created_at?: string
  updated_at?: string
  job_detail: JobDetail | null
}

export type OpportunityUpdate = {
  job_stage?: JobStage
  review_status?: JobReviewStatus
  operator_notes?: string | null
}

export type OpportunityFilters = {
  contact_available?: boolean
  keyword?: string
  min_score?: number
  review_status?: JobReviewStatus | ""
  job_stage?: JobStage | ""
  provider_status?: string
  analysis_status?: AnalysisStatus | ""
}

export type LinkedInCollectionInput = {
  source_type: LinkedInCollectionSourceType
  source_url?: string | null
  provided_text?: string | null
  label?: string | null
}

export type JobSearchRunCreate = {
  keywords?: string[] | null
  collection_source_types: LinkedInCollectionSourceType[]
  collection_inputs: LinkedInCollectionInput[]
  candidate_limit?: number | null
}

export type JobSearchRun = {
  id: string
  status: JobSearchRunStatus
  requested_keywords: string[]
  collection_source_types: string[]
  provider_status: string
  analysis_status: AnalysisStatus
  inspected_count: number
  accepted_count: number
  rejected_count: number
  duplicate_count: number
  cap_reached: boolean
  created_at: string
  updated_at: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
}

export type JobSearchCandidate = {
  id: string
  run_id: string
  opportunity_id: string | null
  outcome: string
  company_name: string | null
  role_title: string | null
  contact_channel_value: string | null
  source_url: string | null
  source_query: string
  source_evidence: string | null
  rejection_reason: string | null
  created_at: string
}

export type TemplateKind = "job_application" | "job_follow_up"

export type EmailTemplate = {
  id: string
  mode: "full_time"
  template_kind: TemplateKind
  name: string
  subject_template: string
  body_template: string
  variables_schema: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export type EmailTemplateCreate = {
  mode: "full_time"
  template_kind: TemplateKind
  name: string
  subject_template: string
  body_template: string
  variables_schema?: Record<string, unknown>
  is_active?: boolean
}

export type EmailTemplateUpdate = Partial<Omit<EmailTemplateCreate, "mode" | "template_kind">>

export type RenderedPreview = {
  subject: string
  body: string
  warnings: string[]
  rendered_variables: Record<string, unknown>
}

export type UserSettings = {
  id: string
  operator_name: string | null
  operator_email: string | null
  default_mode: "full_time"
  created_at: string
  updated_at: string
}

export type UserSettingsUpdate = {
  operator_name?: string | null
  operator_email?: string | null
}

export type ResumeAttachment = {
  id: string
  display_name: string
  file_name: string
  file_path: string
  mime_type: string
  file_size_bytes: number | null
  sha256: string | null
  is_available: boolean
  is_default: boolean
  uploaded_at: string
  created_at: string
  updated_at: string
}

export type ResumeCreate = {
  display_name: string
  file_name: string
  file_path: string
  mime_type: string
  file_size_bytes?: number | null
  sha256?: string | null
}

export type EmailDraft = {
  id: string
  opportunity_id: string
  template_id: string
  template_kind: TemplateKind
  resume_attachment_id: string | null
  to_email: string
  subject: string
  body: string
  warnings: string[]
  status: "draft" | "approved" | "queued" | "sent" | "failed" | "cancelled"
  created_at: string
  updated_at: string
}

export type EmailDraftCreate = {
  opportunity_id: string
  template_id: string
  resume_attachment_id?: string | null
}

export type EmailDraftUpdate = {
  to_email?: string
  subject?: string
  body?: string
  resume_attachment_id?: string | null
}

export type SendingProviderAccount = {
  provider_name: "gmail"
  display_email: string | null
  display_name: string | null
  auth_status: "not_configured" | "authorization_required" | "authorized" | "expired" | "failed"
  send_limit_per_day: number | null
  last_checked_at: string | null
  token_updated_at: string | null
}

export type GoogleOAuthStartResponse = {
  auth_url: string
}

export type SendRequest = {
  id: string
  draft_id: string | null
  opportunity_id: string
  template_id: string
  template_kind: TemplateKind
  resume_attachment_id: string | null
  recipient_email: string
  subject_snapshot: string
  body_snapshot: string
  status:
    | "approved"
    | "queued"
    | "sending"
    | "sent"
    | "failed"
    | "cancelled"
    | "skipped_duplicate"
    | "skipped_missing_contact"
    | "skipped_invalid_contact"
  error_code: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export type BulkSendItem = {
  opportunity_id: string
  recipient_email: string | null
  outcome: "sendable" | "skipped_missing_contact" | "skipped_duplicate" | "blocked_invalid_contact" | "blocked_limit"
  reason: string | null
  draft_id: string | null
}

export type BulkSendBatch = {
  id: string
  status: "previewed" | "approved" | "queued" | "completed" | "completed_with_failures" | "cancelled"
  selected_count: number
  sendable_count: number
  skipped_missing_contact_count: number
  skipped_duplicate_count: number
  blocked_invalid_contact_count: number
  limit_blocked_count: number
  items: BulkSendItem[]
}

export type OutreachEvent = {
  id: string
  opportunity_id: string
  event_type: string
  provider_name: string | null
  provider_message_id: string | null
  recipient_email: string
  template_id: string | null
  template_kind: TemplateKind | null
  resume_attachment_id: string | null
  subject: string | null
  status: string
  error_message: string | null
  occurred_at: string
}
