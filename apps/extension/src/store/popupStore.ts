import { create } from "zustand"

import {
  ApiError,
  approveEmailDraft,
  approveBulkEmail,
  confirmPasswordReset,
  createEmailDraft,
  disconnectGoogleOAuth,
  getCurrentUser,
  getOpportunity,
  getSendingProviderAccount,
  getUserSettings,
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
  uploadResume,
  updateOpportunity
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
  UserSettings
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
  sortMode: "recent" | "relevant"
  maxPosts: number
  maxScrolls: number
  filters: OpportunityFilters
  setActiveTab: (activeTab: PopupTab) => void
  setKeywords: (keywords: string) => void
  setRegion: (region: string) => void
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
  refreshEmailSetup: () => Promise<void>
  connectGoogle: () => Promise<void>
  disconnectGoogle: () => Promise<void>
  uploadResumePdf: (file: File, displayName: string) => Promise<void>
  setDefaultResume: (resumeId: string) => Promise<void>
  prepareEmailDraft: (opportunityId: string, templateId: string, resumeAttachmentId?: string | null) => Promise<void>
  approveActiveDraft: () => Promise<void>
  refreshEmailHistory: (opportunityId: string) => Promise<void>
  previewBulkSend: (opportunityIds: string[], templateId: string, resumeAttachmentId?: string | null) => Promise<void>
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
  return error instanceof Error ? error.message : fallback
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
  sortMode: "recent",
  maxPosts: 50,
  maxScrolls: 15,
  filters: {
    contact_available: true,
    min_score: 0
  },

  setActiveTab: (activeTab) => set({ activeTab }),
  setKeywords: (keywords) => set({ keywords }),
  setRegion: (region) => set({ region }),
  setSortMode: (sortMode) => set({ sortMode }),
  setMaxPosts: (maxPosts) => set({ maxPosts }),
  setMaxScrolls: (maxScrolls) => set({ maxScrolls }),
  setCaptureProgress: (captureProgress) => set({ captureProgress }),
  setSelectedOpportunity: (selectedOpportunity) => set({ selectedOpportunity }),

  initializeAuth: async () => {
    const session = await loadStoredAuthSession()
    if (!session) {
      set({ authReady: true, currentUser: null })
      setApiAccessToken(null)
      return
    }
    setApiAccessToken(session.accessToken)
    try {
      const currentUser = await getCurrentUser()
      await saveStoredAuthSession({ accessToken: session.accessToken, user: currentUser })
      set({ authReady: true, currentUser })
    } catch {
      setApiAccessToken(null)
      await clearStoredAuthSession()
      set({ authReady: true, currentUser: null })
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const session = await apiLogin({ email, password })
      setApiAccessToken(session.access_token)
      await saveStoredAuthSession({ accessToken: session.access_token, user: session.user })
      set({ currentUser: session.user })
      await get().refreshData()
    } catch (error) {
      set({ error: errorMessage(error, "Could not log in.") })
    } finally {
      set({ loading: false })
    }
  },

  register: async (email, password, displayName) => {
    set({ loading: true, error: null })
    try {
      const session = await apiRegister({ email, password, display_name: displayName })
      setApiAccessToken(session.access_token)
      await saveStoredAuthSession({ accessToken: session.access_token, user: session.user })
      set({ currentUser: session.user })
      await get().refreshData()
    } catch (error) {
      set({ error: errorMessage(error, "Could not create account.") })
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    try {
      await apiLogout().catch(() => undefined)
    } finally {
      setApiAccessToken(null)
      await clearStoredAuthSession()
      set({ currentUser: null, opportunities: [], runsCount: 0, selectedOpportunity: null, emailTemplates: [], resumes: [] })
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
    set({ loading: true, error: null })
    try {
      const [opportunities, runs] = await Promise.all([listOpportunities(nextFilters), listJobSearchRuns()])
      set({ opportunities, runsCount: runs.length })
    } catch (error) {
      if (isUnauthorized(error)) {
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
    const { keywords, region, sortMode, maxPosts, maxScrolls } = get()
    set({
      error: null,
      captureProgress: { status: "opening", message: "Opening LinkedIn search..." }
    })

    const response = await sendCaptureRequest({
      keywords,
      region,
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

  approveActiveDraft: async () => {
    const { activeDraft, selectedOpportunity } = get()
    if (!activeDraft) return

    set({ loading: true, error: null })
    try {
      await approveEmailDraft(activeDraft.id)
      set({ activeDraft: null })
      if (selectedOpportunity) {
        await get().openDetail(selectedOpportunity.id)
      }
      await get().refreshData()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not approve email send." })
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
