export const marketScopes = ["BR", "INTERNATIONAL"] as const;
export const campaignStatuses = [
  "draft",
  "ready",
  "collecting",
  "paused",
  "completed",
  "failed",
  "archived"
] as const;
export const prospectingJobStatuses = [
  "pending",
  "running",
  "completed",
  "completed_no_results",
  "failed",
  "cancelled"
] as const;
export const prospectingJobSteps = [
  "queued",
  "discovering_businesses",
  "normalizing_results",
  "deduplicating",
  "fetching_websites",
  "analyzing_websites",
  "scoring_leads",
  "saving_leads",
  "done"
] as const;
export const websiteStatuses = [
  "no_site",
  "social_only",
  "linktree",
  "aggregator",
  "broken",
  "weak_site",
  "usable_site",
  "uncertain"
] as const;
export const leadTemperatures = ["cold", "warm", "hot"] as const;
export const commercialStatuses = [
  "new",
  "contacted",
  "interested",
  "proposal_requested",
  "proposal_sent",
  "won",
  "lost",
  "ignored"
] as const;
export const templateStages = ["first_contact", "follow_up"] as const;
export const generatedTextKinds = ["lovable_prompt", "commercial_message"] as const;
export const generatedPromptVariants = ["complete", "generic", "compact"] as const;
export const generatedMessageVariants = ["first_contact", "follow_up"] as const;
export const outreachChannels = ["email", "whatsapp"] as const;
export const bulkOutreachBatchStatuses = [
  "draft",
  "queued",
  "running",
  "completed",
  "failed",
  "approved",
  "partially_sent",
  "sent"
] as const;
export const bulkOutreachItemStatuses = [
  "queued",
  "generating",
  "generated",
  "generation_failed",
  "missing_contact",
  "invalid_contact",
  "duplicate_blocked",
  "skipped",
  "approved",
  "sending",
  "sent",
  "failed_send"
] as const;
export const outreachEventTypes = [
  "generated",
  "generation_failed",
  "item_updated",
  "skipped",
  "unskipped",
  "approved",
  "queued_send",
  "sent",
  "failed_send",
  "blocked_missing_contact",
  "blocked_invalid_contact",
  "blocked_duplicate",
  "blocked_channel_not_ready",
  "blocked_rate_limit"
] as const;
export const channelReadinessStatuses = [
  "ready",
  "missing_config",
  "missing_credentials",
  "not_approved",
  "missing_template",
  "missing_opt_in",
  "rate_limited",
  "provider_error",
  "disabled"
] as const;
export const outreachDiagnosticCodes = [
  "missing_env",
  "missing_credentials",
  "provider_not_configured",
  "provider_not_approved",
  "template_required",
  "opt_in_required",
  "message_window_closed",
  "daily_limit_reached",
  "provider_rate_limited",
  "provider_unauthorized",
  "provider_rejected",
  "network_error",
  "unknown_provider_error"
] as const;

export const freelanceNavigationItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Campanhas", href: "/campaigns" },
  { label: "Leads", href: "/leads" },
  { label: "Templates", href: "/templates" },
  { label: "Configuracoes", href: "/settings" }
] as const;

export const forbiddenFreelanceCopyTerms = [
  "job",
  "resume",
  "curriculum",
  "candidature",
  "recruiter",
  "application status",
  "interview",
  "ats score"
] as const;
