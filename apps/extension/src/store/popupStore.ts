import { create } from "zustand"

import {
  ApiError,
  approveEmailDraft,
  approveBulkEmail,
  bulkDeleteOpportunities,
  confirmPasswordReset,
  createEmailDraft,
  disconnectGoogleOAuth,
  getCurrentUser,
  getOpportunity,
  getSendingProviderAccount,
  getUserSettings,
  generateAIBulkEmail,
  login as apiLogin,
  listEmailHistory,
  listEmailTemplates,
  listJobSearchRuns,
  listOpportunities,
  listResumes,
  previewBulkEmail,
  register as apiRegister,
  requestPasswordReset,
  setApiAccessToken,
  logout as apiLogout,
  startGoogleOAuth,
  updateResume,
  updateEmailDraft,
  updateBulkEmailItem,
  updateUserSettings as apiUpdateUserSettings,
  uploadResume,
  updateOpportunity,
  deleteOpportunity as apiDeleteOpportunity
} from "../api/client"
import type {
  EmailDraft,
  EmailTemplate,
  BulkSendBatch,
  CurrentUser,
  JobStage,
  JobReviewStatus,
  Opportunity,
  OpportunityFilters,
  OutreachEvent,
  ResumeAttachment,
  SendingProviderAccount,
  UserSettings,
  UserSettingsUpdate
} from "../api/types"
import type { CaptureProgress, CaptureRequest, CaptureResult } from "../capture/types"
import { clearStoredAuthSession, loadStoredAuthSession, saveStoredAuthSession } from "./authSession"

export type PopupTab = "dashboard" | "search" | "jobs" | "templates" | "settings"

type CaptureResponse =
  | { ok: true; result: CaptureResult }
  | { ok: false; error: string }

type OpportunityUpdatePayload = {
  job_stage?: JobStage
  review_status?: JobReviewStatus
  operator_notes?: string | null
}

export const CAPTURE_DEFAULT_MAX_POSTS = 250
export const CAPTURE_DEFAULT_MAX_SCROLLS = 75
export const CAPTURE_MAX_POSTS = 1000
export const CAPTURE_MAX_SCROLLS = 300

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(max, Math.max(min, Math.trunc(value)))
}

type PopupState = {
  activeTab: PopupTab
  opportunities: Opportunity[]
  runsCount: number
  selectedOpportunity: Opportunity | null
  emailTemplates: EmailTemplate[]
  resumes: ResumeAttachment[]
  userSettings: UserSettings | null
  providerAccount: SendingProviderAccount | null
  activeDraft: EmailDraft | null
  emailHistory: OutreachEvent[]
  bulkPreview: BulkSendBatch | null
  currentUser: CurrentUser | null
  authReady: boolean
  loading: boolean
  error: string | null
  captureProgress: CaptureProgress
  keywords: string
  region: string
  aiFiltersEnabled: boolean
  acceptedRegions: string
  excludedRegions: string
  remoteOnly: boolean
  excludeOnsite: boolean
  sortMode: "recent" | "relevant"
  maxPosts: number
  maxScrolls: number
  filters: OpportunityFilters
  setActiveTab: (activeTab: PopupTab) => void
  setKeywords: (keywords: string) => void
  setRegion: (region: string) => void
  setAiFiltersEnabled: (aiFiltersEnabled: boolean) => void
  setAcceptedRegions: (acceptedRegions: string) => void
  setExcludedRegions: (excludedRegions: string) => void
  setRemoteOnly: (remoteOnly: boolean) => void
  setExcludeOnsite: (excludeOnsite: boolean) => void
  setSortMode: (sortMode: "recent" | "relevant") => void
  setMaxPosts: (maxPosts: number) => void
  setMaxScrolls: (maxScrolls: number) => void
  setCaptureProgress: (captureProgress: CaptureProgress) => void
  setSelectedOpportunity: (selectedOpportunity: Opportunity | null) => void
  initializeAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  confirmPasswordReset: (token: string, password: string) => Promise<void>
  refreshData: (nextFilters?: OpportunityFilters) => Promise<void>
  updateFilters: (nextFilters: OpportunityFilters) => Promise<void>
  startCapture: () => Promise<void>
  openDetail: (opportunityId: string) => Promise<void>
  saveOpportunityUpdate: (payload: OpportunityUpdatePayload) => Promise<void>
  deleteOpportunity: (opportunityId: string) => Promise<void>
  deleteOpportunities: (opportunityIds: string[]) => Promise<number>
  deleteOpportunitiesBySendStatus: (sendStatus: "sent" | "unsent") => Promise<number>
  refreshEmailSetup: () => Promise<void>
  connectGoogle: () => Promise<void>
  disconnectGoogle: () => Promise<void>
  updateUserSettings: (payload: UserSettingsUpdate) => Promise<void>
  uploadResumePdf: (file: File, displayName: string) => Promise<void>
  setDefaultResume: (resumeId: string) => Promise<void>
  prepareEmailDraft: (opportunityId: string, templateId: string, resumeAttachmentId?: string | null) => Promise<void>
  updateActiveDraft: (payload: { to_email?: string; subject?: string; body?: string; resume_attachment_id?: string | null }) => Promise<boolean>
  approveActiveDraft: () => Promise<boolean>
  refreshEmailHistory: (opportunityId: string) => Promise<void>
  previewBulkSend: (opportunityIds: string[], templateId: string, resumeAttachmentId?: string | null) => Promise<void>
  generateAIBulkSend: (opportunityIds: string[], resumeAttachmentId?: string | null, templateId?: string | null) => Promise<void>
  updateBulkSendItem: (
    opportunityId: string,
    payload: { recipient_email?: string | null; subject?: string | null; body?: string | null; is_skipped?: boolean }
  ) => Promise<void>
  approveBulkSend: () => Promise<void>
}

const DEFAULT_CAPTURE_PROGRESS: CaptureProgress = {
  status: "idle",
  message: "Ready to capture LinkedIn posts."
}

function sendCaptureRequest(payload: CaptureRequest) {
  return chrome.runtime.sendMessage({ type: "START_LINKEDIN_CAPTURE", payload }) as Promise<CaptureResponse>
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status >= 500) {
    return `Local API error (${error.status}). Check Docker logs for the server traceback.`
  }
  return error instanceof Error ? error.message : fallback
}

function describeError(error: unknown) {
  if (error instanceof ApiError) {
    return { name: error.name, message: error.message, status: error.status }
  }
  if (error instanceof Error) {
    return { name: error.name, message: error.message }
  }
  return { value: String(error) }
}

function isUnauthorized(error: unknown) {
  return error instanceof ApiError && error.status === 401
}

export const usePopupStore = create<PopupState>((set, get) => ({
  activeTab: "dashboard",
  opportunities: [],
  runsCount: 0,
  selectedOpportunity: null,
  emailTemplates: [],
  resumes: [],
  userSettings: null,
  providerAccount: null,
  activeDraft: null,
  emailHistory: [],
  bulkPreview: null,
  currentUser: null,
  authReady: false,
  loading: false,
  error: null,
  captureProgress: DEFAULT_CAPTURE_PROGRESS,
  keywords: "hiring typescript",
  region: "",
  aiFiltersEnabled: false,
  acceptedRegions: "",
  excludedRegions: "India",
  remoteOnly: false,
  excludeOnsite: false,
  sortMode: "recent",
  maxPosts: CAPTURE_DEFAULT_MAX_POSTS,
  maxScrolls: CAPTURE_DEFAULT_MAX_SCROLLS,
  filters: {
    contact_available: true,
    min_score: 0,
    sort_order: "newest"
  },

  setActiveTab: (activeTab) => set({ activeTab }),
  setKeywords: (keywords) => set({ keywords }),
  setRegion: (region) => set({ region }),
  setAiFiltersEnabled: (aiFiltersEnabled) => set({ aiFiltersEnabled }),
  setAcceptedRegions: (acceptedRegions) => set({ acceptedRegions }),
  setExcludedRegions: (excludedRegions) => set({ excludedRegions }),
  setRemoteOnly: (remoteOnly) => set({ remoteOnly }),
  setExcludeOnsite: (excludeOnsite) => set({ excludeOnsite }),
  setSortMode: (sortMode) => set({ sortMode }),
  setMaxPosts: (maxPosts) => set({ maxPosts: clampNumber(maxPosts, 1, CAPTURE_MAX_POSTS) }),
  setMaxScrolls: (maxScrolls) => set({ maxScrolls: clampNumber(maxScrolls, 0, CAPTURE_MAX_SCROLLS) }),
  setCaptureProgress: (captureProgress) => set({ captureProgress }),
  setSelectedOpportunity: (selectedOpportunity) => set({ selectedOpportunity }),

  initializeAuth: async () => {
    console.info("[Opportunity Desk] initializeAuth started")
    const session = await loadStoredAuthSession()
    if (!session) {
      console.info("[Opportunity Desk] no stored auth session found")
      set({ authReady: true, currentUser: null })
      setApiAccessToken(null)
      return
    }
    console.info("[Opportunity Desk] restoring stored auth session")
    setApiAccessToken(session.accessToken)
    try {
      console.info("[Opportunity Desk] validating stored auth session with /auth/me")
      const currentUser = await getCurrentUser()
      await saveStoredAuthSession({ accessToken: session.accessToken, user: currentUser })
      set({ authReady: true, currentUser })
      console.info("[Opportunity Desk] stored auth session validated", { userEmail: currentUser.email })
      await get().refreshData()
    } catch (error) {
      console.info("[Opportunity Desk] stored auth session is invalid or expired", describeError(error))
      setApiAccessToken(null)
      await clearStoredAuthSession()
      set({ authReady: true, currentUser: null })
    }
  },

  login: async (email, password) => {
    console.info("[Opportunity Desk] login started", { email })
    set({ loading: true, error: null })
    try {
      const session = await apiLogin({ email, password })
      console.info("[Opportunity Desk] login API returned session", { userEmail: session.user.email, hasToken: Boolean(session.access_token) })
      setApiAccessToken(session.access_token)
      await saveStoredAuthSession({ accessToken: session.access_token, user: session.user })
      set({ currentUser: session.user })
      console.info("[Opportunity Desk] login session saved and state updated", { userEmail: session.user.email })
      await get().refreshData()
    } catch (error) {
      console.info("[Opportunity Desk] login failed", describeError(error))
      set({ error: errorMessage(error, "Could not log in.") })
    } finally {
      set({ loading: false })
    }
  },

  register: async (email, password, displayName) => {
    console.info("[Opportunity Desk] register started", { email })
    set({ loading: true, error: null })
    try {
      const session = await apiRegister({ email, password, display_name: displayName })
      console.info("[Opportunity Desk] register API returned session", { userEmail: session.user.email, hasToken: Boolean(session.access_token) })
      setApiAccessToken(session.access_token)
      await saveStoredAuthSession({ accessToken: session.access_token, user: session.user })
      set({ currentUser: session.user })
      console.info("[Opportunity Desk] register session saved and state updated", { userEmail: session.user.email })
      await get().refreshData()
    } catch (error) {
      console.info("[Opportunity Desk] register failed", describeError(error))
      set({ error: errorMessage(error, "Could not create account.") })
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    console.info("[Opportunity Desk] logout started")
    try {
      await apiLogout().catch(() => undefined)
    } finally {
      setApiAccessToken(null)
      await clearStoredAuthSession()
      set({ currentUser: null, opportunities: [], runsCount: 0, selectedOpportunity: null, emailTemplates: [], resumes: [] })
      console.info("[Opportunity Desk] logout finished and local auth state cleared")
    }
  },

  requestPasswordReset: async (email) => {
    set({ loading: true, error: null })
    try {
      await requestPasswordReset({ email })
      set({ error: "If that email exists, a reset request was created." })
    } finally {
      set({ loading: false })
    }
  },

  confirmPasswordReset: async (token, password) => {
    set({ loading: true, error: null })
    try {
      await confirmPasswordReset({ token, password })
      set({ error: "Password reset. Please log in with the new password." })
    } catch (error) {
      set({ error: errorMessage(error, "Could not reset password.") })
    } finally {
      set({ loading: false })
    }
  },

  refreshData: async (nextFilters = get().filters) => {
    console.info("[Opportunity Desk] refreshData started", { filters: nextFilters })
    set({ loading: true, error: null })
    try {
      const [opportunities, runs] = await Promise.all([listOpportunities(nextFilters), listJobSearchRuns()])
      set({ opportunities, runsCount: runs.length })
      console.info("[Opportunity Desk] refreshData finished", { opportunities: opportunities.length, runs: runs.length })
    } catch (error) {
      console.info("[Opportunity Desk] refreshData failed", describeError(error))
      if (isUnauthorized(error)) {
        console.info("[Opportunity Desk] refreshData received 401, clearing auth state")
        setApiAccessToken(null)
        await clearStoredAuthSession()
        set({ currentUser: null })
      }
      set({ error: errorMessage(error, "Could not load local API data.") })
    } finally {
      set({ loading: false })
    }
  },

  refreshEmailSetup: async () => {
    set({ loading: true, error: null })
    try {
      const [emailTemplates, resumes, userSettings, providerAccount] = await Promise.all([
        listEmailTemplates(),
        listResumes(),
        getUserSettings(),
        getSendingProviderAccount()
      ])
      set({ emailTemplates, resumes, userSettings, providerAccount })
    } catch (error) {
      if (isUnauthorized(error)) {
        setApiAccessToken(null)
        await clearStoredAuthSession()
        set({ currentUser: null })
      }
      set({ error: errorMessage(error, "Could not load email setup.") })
    } finally {
      set({ loading: false })
    }
  },

  connectGoogle: async () => {
    set({ loading: true, error: null })
    try {
      const { auth_url } = await startGoogleOAuth()
      await chrome.tabs.create({ url: auth_url })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not start Google OAuth." })
    } finally {
      set({ loading: false })
    }
  },

  disconnectGoogle: async () => {
    set({ loading: true, error: null })
    try {
      const providerAccount = await disconnectGoogleOAuth()
      set({ providerAccount })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not disconnect Google." })
    } finally {
      set({ loading: false })
    }
  },

  updateUserSettings: async (payload) => {
    set({ loading: true, error: null })
    try {
      const userSettings = await apiUpdateUserSettings(payload)
      set({ userSettings })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not update user settings." })
    } finally {
      set({ loading: false })
    }
  },

  uploadResumePdf: async (file, displayName) => {
    set({ loading: true, error: null })
    try {
      await uploadResume(file, displayName)
      set({ resumes: await listResumes() })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not upload resume." })
    } finally {
      set({ loading: false })
    }
  },

  setDefaultResume: async (resumeId) => {
    set({ loading: true, error: null })
    try {
      await updateResume(resumeId, { is_default: true })
      set({ resumes: await listResumes() })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not set default resume." })
    } finally {
      set({ loading: false })
    }
  },

  updateFilters: async (nextFilters) => {
    set({ filters: nextFilters })
    await get().refreshData(nextFilters)
  },

  startCapture: async () => {
    const {
      keywords,
      region,
      aiFiltersEnabled,
      acceptedRegions,
      excludedRegions,
      remoteOnly,
      excludeOnsite,
      sortMode,
      maxPosts,
      maxScrolls
    } = get()
    set({
      error: null,
      captureProgress: { status: "opening", message: "Opening LinkedIn search..." }
    })

    const response = await sendCaptureRequest({
      keywords,
      region,
      aiFiltersEnabled,
      acceptedRegions,
      excludedRegions,
      remoteOnly,
      excludeOnsite,
      sortMode,
      maxPosts,
      maxScrolls,
      scrollDelayMs: 2000
    })

    if (response.ok === false) {
      set({ error: response.error })
      return
    }

    await get().refreshData()
  },

  openDetail: async (opportunityId) => {
    set({ loading: true, error: null })
    try {
      const [selectedOpportunity, emailHistory] = await Promise.all([
        getOpportunity(opportunityId),
        listEmailHistory(opportunityId).catch(() => [])
      ])
      set({ selectedOpportunity, emailHistory })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not load opportunity detail." })
    } finally {
      set({ loading: false })
    }
  },

  saveOpportunityUpdate: async (payload) => {
    const { selectedOpportunity } = get()
    if (!selectedOpportunity) return

    set({ loading: true, error: null })
    try {
      const updated = await updateOpportunity(selectedOpportunity.id, payload)
      set({ selectedOpportunity: updated })
      await get().refreshData()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not update opportunity." })
    } finally {
      set({ loading: false })
    }
  },

  deleteOpportunity: async (opportunityId) => {
    set({ loading: true, error: null })
    try {
      await apiDeleteOpportunity(opportunityId)
      const { selectedOpportunity } = get()
      set({
        selectedOpportunity: selectedOpportunity?.id === opportunityId ? null : selectedOpportunity,
        emailHistory: selectedOpportunity?.id === opportunityId ? [] : get().emailHistory
      })
      await get().refreshData()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not delete job." })
    } finally {
      set({ loading: false })
    }
  },

  deleteOpportunities: async (opportunityIds) => {
    if (opportunityIds.length === 0) return 0
    set({ loading: true, error: null })
    try {
      const result = await bulkDeleteOpportunities({ opportunity_ids: opportunityIds })
      const deletedIds = new Set(opportunityIds)
      const { selectedOpportunity } = get()
      set({
        selectedOpportunity: selectedOpportunity && deletedIds.has(selectedOpportunity.id) ? null : selectedOpportunity,
        emailHistory: selectedOpportunity && deletedIds.has(selectedOpportunity.id) ? [] : get().emailHistory
      })
      await get().refreshData()
      return result.deleted_count
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not delete selected jobs." })
      return 0
    } finally {
      set({ loading: false })
    }
  },

  deleteOpportunitiesBySendStatus: async (sendStatus) => {
    set({ loading: true, error: null })
    try {
      const result = await bulkDeleteOpportunities({ send_status: sendStatus })
      const { selectedOpportunity } = get()
      set({
        selectedOpportunity: null,
        emailHistory: selectedOpportunity ? [] : get().emailHistory
      })
      await get().refreshData()
      return result.deleted_count
    } catch (error) {
      set({ error: error instanceof Error ? error.message : `Could not delete ${sendStatus} jobs.` })
      return 0
    } finally {
      set({ loading: false })
    }
  },

  prepareEmailDraft: async (opportunityId, templateId, resumeAttachmentId = undefined) => {
    set({ loading: true, error: null })
    try {
      const activeDraft = await createEmailDraft({
        opportunity_id: opportunityId,
        template_id: templateId,
        resume_attachment_id: resumeAttachmentId
      })
      set({ activeDraft })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not prepare email draft." })
    } finally {
      set({ loading: false })
    }
  },

  updateActiveDraft: async (payload) => {
    const { activeDraft } = get()
    if (!activeDraft) return false

    set({ loading: true, error: null })
    try {
      const updated = await updateEmailDraft(activeDraft.id, payload)
      set({ activeDraft: updated })
      return true
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not update email draft." })
      return false
    } finally {
      set({ loading: false })
    }
  },

  approveActiveDraft: async () => {
    const { activeDraft, selectedOpportunity } = get()
    if (!activeDraft) return false

    set({ loading: true, error: null })
    try {
      const sendRequest = await approveEmailDraft(activeDraft.id)
      if (sendRequest.status === "failed") {
        set({ error: sendRequest.error_message || "Gmail could not send this email." })
        return false
      }
      set({ activeDraft: null })
      if (selectedOpportunity) {
        await get().openDetail(selectedOpportunity.id)
      }
      await get().refreshData()
      return sendRequest.status === "sent"
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not approve email send." })
      return false
    } finally {
      set({ loading: false })
    }
  },

  refreshEmailHistory: async (opportunityId) => {
    set({ loading: true, error: null })
    try {
      set({ emailHistory: await listEmailHistory(opportunityId) })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not load email history." })
    } finally {
      set({ loading: false })
    }
  },

  previewBulkSend: async (opportunityIds, templateId, resumeAttachmentId = undefined) => {
    set({ loading: true, error: null })
    try {
      set({ bulkPreview: await previewBulkEmail({ opportunity_ids: opportunityIds, template_id: templateId, resume_attachment_id: resumeAttachmentId }) })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not preview bulk email." })
    } finally {
      set({ loading: false })
    }
  },

  generateAIBulkSend: async (opportunityIds, resumeAttachmentId = undefined, templateId = undefined) => {
    set({ loading: true, error: null })
    try {
      set({
        bulkPreview: await generateAIBulkEmail({
          opportunity_ids: opportunityIds,
          resume_attachment_id: resumeAttachmentId,
          template_id: templateId
        })
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not generate AI bulk email." })
    } finally {
      set({ loading: false })
    }
  },

  updateBulkSendItem: async (opportunityId, payload) => {
    const { bulkPreview } = get()
    if (!bulkPreview) return
    set({ loading: true, error: null })
    try {
      set({ bulkPreview: await updateBulkEmailItem(bulkPreview.id, opportunityId, payload) })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not update bulk email item." })
    } finally {
      set({ loading: false })
    }
  },

  approveBulkSend: async () => {
    const { bulkPreview } = get()
    if (!bulkPreview) return
    set({ loading: true, error: null })
    try {
      set({ bulkPreview: await approveBulkEmail(bulkPreview.id) })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not approve bulk email." })
    } finally {
      set({ loading: false })
    }
  }
}))
