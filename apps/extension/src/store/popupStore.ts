import { create } from "zustand"

import {
  ApiError,
  approveEmailDraft,
  approveBulkEmail,
  bulkDeleteOpportunities,
  confirmPasswordReset,
  createEmailDraft,
  deleteFieldAssistantActivation as apiDeleteFieldAssistantActivation,
  disconnectGoogleOAuth,
  getCurrentUser,
  getOpportunity,
  getOpportunityMetrics,
  getSendingProviderAccount,
  getUserSettings,
  generateAIBulkEmail,
  listFieldAssistantActivations,
  login as apiLogin,
  listEmailHistory,
  listEmailTemplates,
  listJobSearchRuns,
  listOpportunityPage,
  listResumes,
  previewBulkEmail,
  register as apiRegister,
  requestPasswordReset,
  setApiAccessToken,
  logout as apiLogout,
  startGooglePrimaryAuth,
  startGoogleOAuth,
  updateResume,
  updateEmailDraft,
  updateBulkEmailItem,
  updateFieldAssistantActivation as apiUpdateFieldAssistantActivation,
  updateUserSettings as apiUpdateUserSettings,
  uploadResume,
  updateOpportunity,
  deleteOpportunity as apiDeleteOpportunity
} from "../api/client"
import type {
  EmailDraft,
  AuthSessionResponse,
  EmailTemplate,
  BulkSendBatch,
  CurrentUser,
  FieldAssistantActivation,
  FieldAssistantScopeType,
  JobStage,
  JobReviewStatus,
  Opportunity,
  OpportunityFilters,
  OpportunityMetrics,
  OutreachEvent,
  ResumeAttachment,
  SendingProviderAccount,
  UserSettings,
  UserSettingsUpdate
} from "../api/types"
import type { CaptureProgress, CaptureRequest, CaptureResult } from "../capture/types"
import { FIELD_ASSISTANT_MESSAGE_TYPES, normalizeActivationScope } from "../utils/fieldAssistant"
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
  selectedJobIds: string[]
  showBulkEmail: boolean
  opportunities: Opportunity[]
  dashboardMetrics: OpportunityMetrics
  opportunityPage: number
  opportunityPageSize: number
  opportunityTotalItems: number
  opportunityTotalPages: number
  opportunityHasNext: boolean
  opportunityHasPrevious: boolean
  runsCount: number
  selectedOpportunity: Opportunity | null
  emailTemplates: EmailTemplate[]
  resumes: ResumeAttachment[]
  userSettings: UserSettings | null
  fieldAssistantActivations: FieldAssistantActivation[]
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
  clearError: () => void
  setActiveTab: (activeTab: PopupTab) => void
  setSelectedJobIds: (selectedJobIds: string[]) => void
  setShowBulkEmail: (showBulkEmail: boolean) => void
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
  loginWithGoogle: () => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  confirmPasswordReset: (token: string, password: string) => Promise<void>
  refreshData: (nextFilters?: OpportunityFilters) => Promise<void>
  updateFilters: (nextFilters: OpportunityFilters) => Promise<void>
  startCapture: () => Promise<void>
  openDetail: (opportunityId: string) => Promise<void>
  saveOpportunityUpdate: (payload: OpportunityUpdatePayload) => Promise<void>
  updateOpportunityStatus: (opportunityId: string, payload: OpportunityUpdatePayload) => Promise<void>
  deleteOpportunity: (opportunityId: string) => Promise<void>
  deleteOpportunities: (opportunityIds: string[]) => Promise<number>
  refreshEmailSetup: () => Promise<void>
  refreshFieldAssistantActivations: () => Promise<void>
  enableFieldAssistantForCurrent: (scopeType: FieldAssistantScopeType) => Promise<void>
  updateFieldAssistantActivation: (id: string, payload: { display_name?: string | null; enabled?: boolean }) => Promise<void>
  deleteFieldAssistantActivation: (id: string) => Promise<void>
  connectGoogle: () => Promise<void>
  disconnectGoogle: () => Promise<void>
  updateUserSettings: (payload: UserSettingsUpdate) => Promise<void>
  uploadResumePdf: (file: File, displayName: string) => Promise<void>
  setDefaultResume: (resumeId: string) => Promise<void>
  setResumeAssistantContext: (resumeId: string, enabled: boolean) => Promise<void>
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

const DEFAULT_DASHBOARD_METRICS: OpportunityMetrics = {
  total: 0,
  with_email: 0,
  saved: 0,
  applied: 0,
  interviews: 0,
  unsent: 0
}

type PersistedPopupState = {
  activeTab?: PopupTab
  selectedJobIds?: string[]
  showBulkEmail?: boolean
  selectedOpportunityId?: string | null
  filters?: OpportunityFilters
  captureProgress?: CaptureProgress
}

const POPUP_STATE_STORAGE_KEY = "opportunity-desk-popup-state"

function loadPersistedPopupState(): PersistedPopupState {
  try {
    const raw = window.localStorage.getItem(POPUP_STATE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedPopupState) : {}
  } catch {
    return {}
  }
}

function persistPopupState(update: PersistedPopupState) {
  try {
    const current = loadPersistedPopupState()
    window.localStorage.setItem(POPUP_STATE_STORAGE_KEY, JSON.stringify({ ...current, ...update }))
  } catch {
    // Best-effort UI persistence only.
  }
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

function filtersWithoutPage(filters: OpportunityFilters) {
  const { page, page_size, ...rest } = filters
  return rest
}

function didFilterCriteriaChange(current: OpportunityFilters, next: OpportunityFilters) {
  return JSON.stringify(filtersWithoutPage(current)) !== JSON.stringify(filtersWithoutPage(next))
}

export function resolveOpportunityPageFilters(current: OpportunityFilters, next: OpportunityFilters): OpportunityFilters {
  return {
    ...next,
    page: didFilterCriteriaChange(current, next) ? 1 : next.page || current.page || 1,
    page_size: next.page_size || current.page_size || 50
  }
}

async function persistAuthSession(session: AuthSessionResponse) {
  setApiAccessToken(session.access_token)
  await saveStoredAuthSession({ accessToken: session.access_token, user: session.user })
}

function parseGoogleAuthSession(finalUrl: string): AuthSessionResponse | null {
  const url = new URL(finalUrl)
  const params = new URLSearchParams(url.hash.replace(/^#/, ""))
  const error = params.get("error")
  if (error) {
    throw new Error(error)
  }
  const accessToken = params.get("access_token")
  const user = params.get("user")
  if (!accessToken || !user) {
    return null
  }
  return {
    access_token: accessToken,
    token_type: "bearer",
    user: JSON.parse(user)
  }
}

const persistedPopupState = loadPersistedPopupState()
const persistedFilters = persistedPopupState.filters
  ? { ...persistedPopupState.filters, review_status: "" as const }
  : undefined

export const usePopupStore = create<PopupState>((set, get) => ({
  activeTab: persistedPopupState.activeTab || "dashboard",
  selectedJobIds: persistedPopupState.selectedJobIds || [],
  showBulkEmail: persistedPopupState.showBulkEmail || false,
  opportunities: [],
  dashboardMetrics: DEFAULT_DASHBOARD_METRICS,
  opportunityPage: persistedFilters?.page || 1,
  opportunityPageSize: persistedFilters?.page_size || 50,
  opportunityTotalItems: 0,
  opportunityTotalPages: 1,
  opportunityHasNext: false,
  opportunityHasPrevious: false,
  runsCount: 0,
  selectedOpportunity: null,
  emailTemplates: [],
  resumes: [],
  userSettings: null,
  fieldAssistantActivations: [],
  providerAccount: null,
  activeDraft: null,
  emailHistory: [],
  bulkPreview: null,
  currentUser: null,
  authReady: false,
  loading: false,
  error: null,
  captureProgress: persistedPopupState.captureProgress || DEFAULT_CAPTURE_PROGRESS,
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
  filters: persistedFilters || {
    contact_available: true,
    min_score: 0,
    sort_order: "newest",
    page: 1,
    page_size: 50
  },

  clearError: () => set({ error: null }),

  setActiveTab: (activeTab) => {
    persistPopupState({ activeTab })
    set({ activeTab })
  },
  setSelectedJobIds: (selectedJobIds) => {
    persistPopupState({ selectedJobIds })
    set({ selectedJobIds })
  },
  setShowBulkEmail: (showBulkEmail) => {
    persistPopupState({ showBulkEmail })
    set({ showBulkEmail })
  },
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
  setCaptureProgress: (captureProgress) => {
    persistPopupState({ captureProgress })
    set({ captureProgress })
  },
  setSelectedOpportunity: (selectedOpportunity) => {
    persistPopupState({ selectedOpportunityId: selectedOpportunity?.id || null })
    set({ selectedOpportunity })
  },

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

  loginWithGoogle: async () => {
    console.info("[Opportunity Desk] Google primary auth started")
    set({ loading: true, error: null })
    try {
      const identity = chrome.identity
      const successRedirectUrl = identity?.getRedirectURL?.("google-auth")
      const { auth_url } = await startGooglePrimaryAuth(successRedirectUrl)
      if (!identity?.launchWebAuthFlow || !successRedirectUrl) {
        await chrome.tabs.create({ url: auth_url })
        set({ error: "Chrome identity is unavailable. Complete Google sign-in in the opened tab, then reopen the popup." })
        return
      }

      const finalUrl = await identity.launchWebAuthFlow({ url: auth_url, interactive: true })
      if (!finalUrl) {
        throw new Error("Google sign-in did not return an app session.")
      }
      const session = parseGoogleAuthSession(finalUrl)
      if (!session) {
        throw new Error("Google sign-in completed, but no app session was returned to the extension.")
      }
      await persistAuthSession(session)
      set({ currentUser: session.user })
      await get().refreshData()
    } catch (error) {
      console.info("[Opportunity Desk] Google primary auth failed", describeError(error))
      set({ error: errorMessage(error, "Could not sign in with Google.") })
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
      await chrome.runtime.sendMessage({ type: FIELD_ASSISTANT_MESSAGE_TYPES.closeShell }).catch(() => undefined)
      setApiAccessToken(null)
      await clearStoredAuthSession()
      persistPopupState({ selectedJobIds: [], showBulkEmail: false, selectedOpportunityId: null })
      set({
        currentUser: null,
        opportunities: [],
        runsCount: 0,
        selectedOpportunity: null,
        selectedJobIds: [],
        showBulkEmail: false,
        emailTemplates: [],
        resumes: [],
        fieldAssistantActivations: []
      })
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
      const pageFilters = { ...nextFilters, page: nextFilters.page || 1, page_size: nextFilters.page_size || 50 }
      const [opportunityPage, runs, dashboardMetrics] = await Promise.all([
        listOpportunityPage(pageFilters),
        listJobSearchRuns(),
        getOpportunityMetrics()
      ])
      const visibleIds = new Set(opportunityPage.items.map((opportunity) => opportunity.id))
      const selectedJobIds = get().selectedJobIds.filter((id) => visibleIds.has(id))
      persistPopupState({ selectedJobIds, filters: { ...pageFilters, page: opportunityPage.page, page_size: opportunityPage.page_size } })
      set({
        opportunities: opportunityPage.items,
        dashboardMetrics,
        opportunityPage: opportunityPage.page,
        opportunityPageSize: opportunityPage.page_size,
        opportunityTotalItems: opportunityPage.total_items,
        opportunityTotalPages: opportunityPage.total_pages,
        opportunityHasNext: opportunityPage.has_next,
        opportunityHasPrevious: opportunityPage.has_previous,
        selectedJobIds,
        filters: { ...pageFilters, page: opportunityPage.page, page_size: opportunityPage.page_size },
        runsCount: runs.length
      })
      const selectedOpportunityId = loadPersistedPopupState().selectedOpportunityId
      if (selectedOpportunityId && !get().selectedOpportunity) {
        await get().openDetail(selectedOpportunityId).catch(() => persistPopupState({ selectedOpportunityId: null }))
      }
      console.info("[Opportunity Desk] refreshData finished", { opportunities: opportunityPage.items.length, runs: runs.length })
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

  refreshFieldAssistantActivations: async () => {
    set({ loading: true, error: null })
    try {
      set({ fieldAssistantActivations: await listFieldAssistantActivations(), error: null })
    } catch (error) {
      if (isUnauthorized(error)) {
        setApiAccessToken(null)
        await clearStoredAuthSession()
        set({ currentUser: null })
      }
      set({ error: errorMessage(error, "Could not load field assistant sites.") })
    } finally {
      set({ loading: false })
    }
  },

  enableFieldAssistantForCurrent: async (scopeType) => {
    set({ loading: true, error: null })
    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
      const rawUrl = tab?.url || ""
      const scopeValue = normalizeActivationScope(scopeType, rawUrl)
      if (!scopeValue) {
        throw new Error("Open a regular web page before enabling the field assistant.")
      }
      const response = await chrome.runtime.sendMessage({
        type: FIELD_ASSISTANT_MESSAGE_TYPES.enableCurrent,
        payload: { scopeType, url: rawUrl }
      })
      if (!response?.ok) {
        throw new Error(response?.error || "Could not enable field assistant for this page.")
      }
      set({ fieldAssistantActivations: await listFieldAssistantActivations() })
    } catch (error) {
      const message = errorMessage(error, "Could not enable field assistant for this page.")
      set({ error: message })
      throw new Error(message)
    } finally {
      set({ loading: false })
    }
  },

  updateFieldAssistantActivation: async (id, payload) => {
    set({ loading: true, error: null })
    try {
      await apiUpdateFieldAssistantActivation(id, payload)
      set({ fieldAssistantActivations: await listFieldAssistantActivations() })
    } catch (error) {
      set({ error: errorMessage(error, "Could not update field assistant site.") })
    } finally {
      set({ loading: false })
    }
  },

  deleteFieldAssistantActivation: async (id) => {
    set({ loading: true, error: null })
    try {
      await apiDeleteFieldAssistantActivation(id)
      set({ fieldAssistantActivations: await listFieldAssistantActivations() })
    } catch (error) {
      set({ error: errorMessage(error, "Could not remove field assistant site.") })
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

  setResumeAssistantContext: async (resumeId, enabled) => {
    set({ loading: true, error: null })
    try {
      await updateResume(resumeId, { include_in_field_assistant_context: enabled })
      set({ resumes: await listResumes() })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not update assistant resume context." })
    } finally {
      set({ loading: false })
    }
  },

  updateFilters: async (nextFilters) => {
    const currentFilters = get().filters
    const pageScopedFilters = resolveOpportunityPageFilters(currentFilters, nextFilters)
    persistPopupState({ filters: pageScopedFilters, selectedJobIds: [] })
    set({ filters: pageScopedFilters, selectedJobIds: [] })
    await get().refreshData(pageScopedFilters)
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
    const captureProgress: CaptureProgress = { status: "opening", message: "Opening LinkedIn search..." }
    persistPopupState({ captureProgress })
    set({
      error: null,
      captureProgress
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
    persistPopupState({ selectedOpportunityId: opportunityId })
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

  updateOpportunityStatus: async (opportunityId, payload) => {
    set({ loading: true, error: null })
    try {
      const updated = await updateOpportunity(opportunityId, payload)
      const { selectedOpportunity } = get()
      set({
        selectedOpportunity: selectedOpportunity?.id === opportunityId ? updated : selectedOpportunity,
        opportunities: get().opportunities.map((opportunity) => (opportunity.id === opportunityId ? updated : opportunity))
      })
      await get().refreshData()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not update job status." })
    } finally {
      set({ loading: false })
    }
  },

  deleteOpportunity: async (opportunityId) => {
    set({ loading: true, error: null })
    try {
      await apiDeleteOpportunity(opportunityId)
      const { selectedOpportunity } = get()
      const selectedJobIds = get().selectedJobIds.filter((id) => id !== opportunityId)
      persistPopupState({
        selectedJobIds,
        selectedOpportunityId: selectedOpportunity?.id === opportunityId ? null : selectedOpportunity?.id || null
      })
      set({
        selectedJobIds,
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
      const selectedJobIds = get().selectedJobIds.filter((id) => !deletedIds.has(id))
      persistPopupState({
        selectedJobIds,
        selectedOpportunityId: selectedOpportunity && deletedIds.has(selectedOpportunity.id) ? null : selectedOpportunity?.id || null
      })
      set({
        selectedJobIds,
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
