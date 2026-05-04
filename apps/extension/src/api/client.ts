import type {
  AuthSessionResponse,
  BulkSendBatch,
  EmailDraft,
  EmailDraftCreate,
  EmailDraftUpdate,
  EmailTemplate,
  EmailTemplateCreate,
  EmailTemplateUpdate,
  GoogleOAuthStartResponse,
  LoginRequest,
  JobSearchCandidate,
  JobSearchRun,
  JobSearchRunCreate,
  Opportunity,
  OpportunityFilters,
  OpportunityUpdate,
  OutreachEvent,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RenderedPreview,
  RegisterRequest,
  ResumeAttachment,
  ResumeCreate,
  SendingProviderAccount,
  SendRequest,
  TemplateKind,
  UserSettings,
  UserSettingsUpdate
} from "./types"

const DEFAULT_API_BASE_URL = "http://localhost:8000"

export const API_BASE_URL =
  process.env.PLASMO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || DEFAULT_API_BASE_URL

type RequestOptions = {
  signal?: AbortSignal
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

let accessToken: string | null = null

export function setApiAccessToken(token: string | null) {
  accessToken = token
}

async function request<T>(path: string, init: RequestInit = {}, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    signal: options.signal
  })

  if (!response.ok) {
    const message = await response.text()
    throw new ApiError(response.status, message || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }
  return response.json() as Promise<T>
}

export function register(payload: RegisterRequest, options?: RequestOptions) {
  return request<AuthSessionResponse>("/auth/register", { method: "POST", body: JSON.stringify(payload) }, options)
}

export function login(payload: LoginRequest, options?: RequestOptions) {
  return request<AuthSessionResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) }, options)
}

export function logout(options?: RequestOptions) {
  return request<void>("/auth/logout", { method: "POST" }, options)
}

export function getCurrentUser(options?: RequestOptions) {
  return request<AuthSessionResponse["user"]>("/auth/me", {}, options)
}

export function requestPasswordReset(payload: PasswordResetRequest, options?: RequestOptions) {
  return request<{ status: string }>("/auth/password-reset/request", { method: "POST", body: JSON.stringify(payload) }, options)
}

export function confirmPasswordReset(payload: PasswordResetConfirmRequest, options?: RequestOptions) {
  return request<AuthSessionResponse["user"]>(
    "/auth/password-reset/confirm",
    { method: "POST", body: JSON.stringify(payload) },
    options
  )
}

function appendIfPresent(params: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null || value === "") {
    return
  }
  params.set(key, String(value))
}

export async function listOpportunities(filters: OpportunityFilters = {}, options?: RequestOptions) {
  const params = new URLSearchParams({ opportunity_type: "job" })
  appendIfPresent(params, "contact_available", filters.contact_available)
  appendIfPresent(params, "keyword", filters.keyword?.trim())
  appendIfPresent(params, "min_score", filters.min_score)
  appendIfPresent(params, "review_status", filters.review_status)
  appendIfPresent(params, "job_stage", filters.job_stage)
  appendIfPresent(params, "provider_status", filters.provider_status?.trim())
  appendIfPresent(params, "analysis_status", filters.analysis_status)

  return request<Opportunity[]>(`/opportunities?${params.toString()}`, {}, options)
}

export function getOpportunity(id: string, options?: RequestOptions) {
  return request<Opportunity>(`/opportunities/${id}`, {}, options)
}

export function updateOpportunity(id: string, payload: OpportunityUpdate, options?: RequestOptions) {
  return request<Opportunity>(
    `/opportunities/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    },
    options
  )
}

export function listJobSearchRuns(options?: RequestOptions) {
  return request<JobSearchRun[]>("/job-search-runs?limit=20", {}, options)
}

export function getJobSearchRun(id: string, options?: RequestOptions) {
  return request<JobSearchRun>(`/job-search-runs/${id}`, {}, options)
}

export function listRunCandidates(id: string, options?: RequestOptions) {
  return request<JobSearchCandidate[]>(`/job-search-runs/${id}/candidates`, {}, options)
}

export function listRunOpportunities(id: string, options?: RequestOptions) {
  return request<Opportunity[]>(`/job-search-runs/${id}/opportunities`, {}, options)
}

export function createAuthenticatedBrowserRun(payload: JobSearchRunCreate, options?: RequestOptions) {
  return request<JobSearchRun>(
    "/job-search-runs",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    options
  )
}

export function getUserSettings(options?: RequestOptions) {
  return request<UserSettings>("/user-settings", {}, options)
}

export function updateUserSettings(payload: UserSettingsUpdate, options?: RequestOptions) {
  return request<UserSettings>("/user-settings", { method: "PATCH", body: JSON.stringify(payload) }, options)
}

export function listResumes(options?: RequestOptions) {
  return request<ResumeAttachment[]>("/user-settings/resumes", {}, options)
}

export function createResume(payload: ResumeCreate, options?: RequestOptions) {
  return request<ResumeAttachment>(
    "/user-settings/resumes",
    { method: "POST", body: JSON.stringify(payload) },
    options
  )
}

export function uploadResume(file: File, displayName: string, options?: RequestOptions) {
  const formData = new FormData()
  formData.set("file", file)
  formData.set("display_name", displayName)
  return request<ResumeAttachment>(
    "/user-settings/resumes/upload",
    { method: "POST", body: formData },
    options
  )
}

export function updateResume(id: string, payload: { display_name?: string; is_available?: boolean; is_default?: boolean }, options?: RequestOptions) {
  return request<ResumeAttachment>(
    `/user-settings/resumes/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    options
  )
}

export function resumeFileUrl(id: string) {
  return `${API_BASE_URL}/user-settings/resumes/${id}/file`
}

export function listEmailTemplates(templateKind?: TemplateKind, options?: RequestOptions) {
  const params = new URLSearchParams({ mode: "full_time" })
  appendIfPresent(params, "template_kind", templateKind)
  return request<EmailTemplate[]>(`/email-templates?${params.toString()}`, {}, options)
}

export function createEmailTemplate(payload: EmailTemplateCreate, options?: RequestOptions) {
  return request<EmailTemplate>("/email-templates", { method: "POST", body: JSON.stringify(payload) }, options)
}

export function updateEmailTemplate(id: string, payload: EmailTemplateUpdate, options?: RequestOptions) {
  return request<EmailTemplate>(`/email-templates/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, options)
}

export function previewEmailTemplate(
  id: string,
  payload: { opportunity_id?: string | null; resume_attachment_id?: string | null; sample_values?: Record<string, unknown> },
  options?: RequestOptions
) {
  return request<RenderedPreview>(
    `/email-templates/${id}/preview`,
    { method: "POST", body: JSON.stringify(payload) },
    options
  )
}

export function createEmailDraft(payload: EmailDraftCreate, options?: RequestOptions) {
  return request<EmailDraft>("/email-drafts", { method: "POST", body: JSON.stringify(payload) }, options)
}

export function updateEmailDraft(id: string, payload: EmailDraftUpdate, options?: RequestOptions) {
  return request<EmailDraft>(`/email-drafts/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, options)
}

export function approveEmailDraft(id: string, options?: RequestOptions) {
  return request<SendRequest>(`/email-drafts/${id}/approve-send`, { method: "POST" }, options)
}

export function getSendingProviderAccount(options?: RequestOptions) {
  return request<SendingProviderAccount>("/sending/provider-account", {}, options)
}

export function startGoogleOAuth(options?: RequestOptions) {
  return request<GoogleOAuthStartResponse>("/sending/google-oauth/start", {}, options)
}

export function disconnectGoogleOAuth(options?: RequestOptions) {
  return request<SendingProviderAccount>("/sending/google-oauth/disconnect", { method: "POST" }, options)
}

export function previewBulkEmail(
  payload: { opportunity_ids: string[]; template_id: string; resume_attachment_id?: string | null },
  options?: RequestOptions
) {
  return request<BulkSendBatch>("/bulk-email/preview", { method: "POST", body: JSON.stringify(payload) }, options)
}

export function approveBulkEmail(batchId: string, options?: RequestOptions) {
  return request<BulkSendBatch>(`/bulk-email/${batchId}/approve`, { method: "POST" }, options)
}

export function listEmailHistory(opportunityId: string, options?: RequestOptions) {
  return request<OutreachEvent[]>(`/opportunities/${opportunityId}/email-history`, {}, options)
}
