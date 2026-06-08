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

export const freelanceNavigationItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Campanhas", href: "/campaigns" },
  { label: "Leads", href: "/leads" },
  { label: "Templates", href: "/templates" },
  { label: "Configuracoes", href: "/settings" }
] as const;

export const forbiddenFreelanceCopyTerms = [
  "resume",
  "curriculum",
  "candidature",
  "application status",
  "interview",
  "ats score"
] as const;
