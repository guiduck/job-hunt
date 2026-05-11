import {
  createFieldAssistantActivation,
  createAuthenticatedBrowserRun,
  generateFieldAnswerFromInput,
  getJobSearchRun,
  listFieldAssistantActivations,
  listFieldResponseSuggestions,
  listRunCandidates,
  listRunOpportunities,
  recordFieldResponseSuggestionUsed,
  saveFieldResponseSuggestion,
  setApiAccessToken
} from "./src/api/client"
import type { FieldAssistantScopeType } from "./src/api/types"
import { buildLinkedInContentSearchUrl, normalizeKeywords, toCollectionInputs } from "./src/capture/linkedin"
import type {
  CaptureProgress,
  CaptureRequest,
  CaptureResult,
  CaptureVerification,
  ContentCaptureResponse,
  StartCaptureMessage
} from "./src/capture/types"
import { loadStoredAuthSession } from "./src/store/authSession"
import {
  FIELD_ASSISTANT_MESSAGE_TYPES,
  findMatchingActivation,
  isSensitiveFieldMeta,
  isSearchFieldMeta,
  isSupportedPageUrl,
  normalizeActivationScope,
  normalizeBaseDomain,
  normalizeExactPage,
  type FieldAssistantGeneratePayload
} from "./src/utils/fieldAssistant"

let latestProgress: CaptureProgress = {
  status: "idle",
  message: "Ready to capture LinkedIn posts."
}

const RUN_VERIFICATION_MAX_ATTEMPTS = 120
const RUN_VERIFICATION_POLL_INTERVAL_MS = 2000

function setProgress(progress: CaptureProgress) {
  latestProgress = progress
  console.info("[Opportunity Desk] capture progress", progress)
  chrome.runtime.sendMessage({ type: "CAPTURE_PROGRESS", payload: progress }).catch(() => undefined)
}

function waitForTabComplete(tabId: number) {
  return new Promise<void>((resolve) => {
    const listener = (updatedTabId: number, changeInfo: { status?: string }) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener)
        resolve()
      }
    }

    chrome.tabs.onUpdated.addListener(listener)
  })
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function splitTerms(input: string) {
  return input
    .split(/[,\n]/)
    .map((term) => term.trim())
    .filter(Boolean)
}

async function restoreBackgroundAuth() {
  console.info("[Opportunity Desk] background auth restore started")
  const session = await loadStoredAuthSession()
  if (!session) {
    setApiAccessToken(null)
    console.info("[Opportunity Desk] background auth restore failed: no stored session")
    throw new Error("Login required. Open the extension and log in again before capturing LinkedIn posts.")
  }

  setApiAccessToken(session.accessToken)
  console.info("[Opportunity Desk] background auth restored for API requests", { userEmail: session.user.email })
}

async function tryRestoreBackgroundAuth() {
  const session = await loadStoredAuthSession()
  if (!session) {
    setApiAccessToken(null)
    return null
  }
  setApiAccessToken(session.accessToken)
  return session
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  return tabs[0] || null
}

async function sendFieldAssistantMessageToTab(message: Record<string, unknown>, tabId?: number) {
  const targetTabId = tabId ?? (await getActiveTab())?.id
  if (targetTabId === undefined) {
    return { ok: false, error: "No active tab available." }
  }
  try {
    await chrome.tabs.sendMessage(targetTabId, message)
    return { ok: true }
  } catch {
    return { ok: false, error: "Open a regular web page or reload it before opening the assistant." }
  }
}

async function getFieldAssistantPageStatus(pageUrl?: string) {
  const url = pageUrl || (await getActiveTab())?.url || ""
  const session = await tryRestoreBackgroundAuth()
  if (!session) {
    return { status: "unauthenticated", message: "Log in to Opportunity Desk before using the field assistant." }
  }
  if (!isSupportedPageUrl(url)) {
    return { status: "unsupported", message: "Field assistant works on regular http/https pages only." }
  }
  const [baseDomain, exactPage] = [normalizeBaseDomain(url), normalizeExactPage(url)]
  if (!baseDomain || !exactPage) {
    return { status: "unsupported", message: "Field assistant could not understand this page URL." }
  }
  const activations = await listFieldAssistantActivations()
  const activation = findMatchingActivation(url, activations)
  if (!activation) {
    return {
      status: "disabled",
      message: "Field assistant is disabled on this site.",
      baseDomain,
      exactPage
    }
  }
  return {
    status: "enabled",
    message: `Field assistant enabled for ${activation.scope_value}.`,
    baseDomain,
    exactPage,
    activation
  }
}

async function enableFieldAssistantCurrent(scopeType: FieldAssistantScopeType, pageUrl?: string) {
  const tab = await getActiveTab()
  const url = pageUrl || tab?.url || ""
  await restoreBackgroundAuth()
  const scopeValue = normalizeActivationScope(scopeType, url)
  if (!scopeValue) {
    throw new Error("Open a regular web page before enabling the field assistant.")
  }
  const activation = await createFieldAssistantActivation({
    scope_type: scopeType,
    scope_value: scopeValue,
    display_name: scopeType === "base_domain" ? scopeValue : new URL(url).hostname
  })
  await sendFieldAssistantMessageToTab({ type: FIELD_ASSISTANT_MESSAGE_TYPES.pageStatusChanged, payload: await getFieldAssistantPageStatus(url) }, tab?.id)
  return activation
}

async function generateFieldAssistantAnswer(payload: FieldAssistantGeneratePayload) {
  await restoreBackgroundAuth()
  if (isSensitiveFieldMeta(payload)) {
    throw new Error("This field looks sensitive, so Opportunity Desk will not read or generate content for it.")
  }
  if (isSearchFieldMeta(payload)) {
    throw new Error("Opportunity Desk does not generate answers for search fields.")
  }
  const status = await getFieldAssistantPageStatus(payload.scopeUrl)
  if (status.status !== "enabled") {
    throw new Error("Enable this site in Opportunity Desk before generating an answer.")
  }
  const response = await generateFieldAnswerFromInput({
    scope_url: payload.scopeUrl,
    field_label: payload.fieldLabel,
    field_name: payload.fieldName,
    field_placeholder: payload.fieldPlaceholder,
    field_type: payload.fieldType,
    keyword: payload.keyword,
    question_text: payload.questionText,
    surrounding_text: payload.surroundingText
  })
  const suggestions = await listFieldResponseSuggestions(response.keyword).catch(() => [])
  return {
    ok: true,
    generationId: "",
    keyword: response.keyword,
    answerText: response.answer_text,
    rationale: response.rationale,
    missingContext: response.missing_context,
    suggestions
  }
}

async function sendCaptureMessage(tabId: number, payload: CaptureRequest): Promise<ContentCaptureResponse> {
  let lastError: unknown

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: "CAPTURE_LINKEDIN_POSTS",
        payload: {
          maxPosts: payload.maxPosts,
          maxScrolls: payload.maxScrolls,
          scrollDelayMs: payload.scrollDelayMs
        }
      })

      return response as ContentCaptureResponse
    } catch (error) {
      lastError = error
      await delay(500)
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Could not reach the LinkedIn content script.")
}

async function startCapture(payload: CaptureRequest): Promise<CaptureResult> {
  console.info("[Opportunity Desk] start capture requested", payload)
  await restoreBackgroundAuth()
  setProgress({ status: "opening", message: "Opening recent LinkedIn content search..." })
  const tab = await chrome.tabs.create({
    active: true,
    url: buildLinkedInContentSearchUrl({
      keywords: payload.keywords,
      sortMode: payload.sortMode
    })
  })

  if (tab.id === undefined) {
    throw new Error("Chrome did not return a tab id for the LinkedIn search.")
  }

  await waitForTabComplete(tab.id)
  await delay(1200)

  setProgress({
    status: "capturing",
    message: "Scrolling and reading visible LinkedIn posts...",
    sourceTabId: tab.id
  })
  const captured = await sendCaptureMessage(tab.id, payload)
  const posts = captured.posts.slice(0, payload.maxPosts)
  const diagnostics = captured.diagnostics
  const sampleLabels = posts.slice(0, 5).map((post) => post.label)
  console.info("[Opportunity Desk] posts returned from LinkedIn content script", {
    postsFound: posts.length,
    sampleLabels,
    diagnostics,
    samplePosts: posts.slice(0, 3).map((post) => ({
      label: post.label,
      sourceUrl: post.sourceUrl,
      textLength: post.providedText.length,
      textPreview: post.providedText.slice(0, 220)
    }))
  })

  if (posts.length === 0) {
    throw new Error("No LinkedIn posts were captured. Try a broader search query or more scrolls.")
  }

  setProgress({
    status: "submitting",
    message: "Submitting captured posts to the local API.",
    postsFound: posts.length,
    sourceTabId: tab.id,
    sampleLabels,
    diagnostics
  })
  const aiFilterPayload = payload.aiFiltersEnabled
    ? {
        ai_filters_enabled: true,
        ai_filter_settings: {
          remote_only: payload.remoteOnly,
          exclude_onsite: payload.excludeOnsite,
          accepted_regions: splitTerms(payload.acceptedRegions),
          excluded_regions: splitTerms(payload.excludedRegions)
        }
      }
    : { ai_filters_enabled: false }
  const run = await createAuthenticatedBrowserRun({
    keywords: normalizeKeywords(payload.keywords),
    search_query: payload.keywords.trim(),
    search_sort_order: payload.sortMode,
    collection_source_types: ["authenticated_browser_search"],
    collection_inputs: toCollectionInputs(posts),
    candidate_limit: null,
    ...aiFilterPayload
  })
  console.info("[Opportunity Desk] API run created", {
    runId: run.id,
    runStatus: run.status,
    postsSubmitted: posts.length,
    requestedKeywords: run.requested_keywords
  })

  setProgress({
    status: "processing",
    message: `Run ${run.id} was created. Waiting for worker processing...`,
    postsFound: posts.length,
    runId: run.id,
    sourceTabId: tab.id,
    sampleLabels,
    diagnostics,
    verification: {
      runStatus: run.status,
      inspectedCount: run.inspected_count,
      acceptedCount: run.accepted_count,
      rejectedCount: run.rejected_count,
      duplicateCount: run.duplicate_count,
      aiFilterInspectedCount: run.ai_filter_inspected_count,
      aiFilterPassedCount: run.ai_filter_passed_count,
      aiFilterRejectedCount: run.ai_filter_rejected_count,
      aiFilterFallbackCount: run.ai_filter_fallback_count,
      aiFilterFailedCount: run.ai_filter_failed_count,
      aiFilterSkippedCount: run.ai_filter_skipped_count,
      message: "Run accepted by API; worker has not necessarily processed it yet."
    }
  })

  const sharedProgress = {
    postsFound: posts.length,
    runId: run.id,
    sourceTabId: tab.id,
    sampleLabels,
    diagnostics
  }
  const verification = await verifyRunProcessing(run.id, {
    onProgress: (nextVerification) => {
      setProgress({
        status: "processing",
        message: `Run ${run.id} is being processed. ${nextVerification.message}`,
        ...sharedProgress,
        verification: nextVerification
      })
    }
  })
  const runReachedTerminalStatus = Boolean(verification.runStatus && verification.runStatus !== "pending" && verification.runStatus !== "running")
  const finalStatus: CaptureProgress["status"] = verification.runStatus === "failed" ? "failed" : runReachedTerminalStatus ? "completed" : "processing"
  const finalMessage = runReachedTerminalStatus
    ? `Created run ${run.id}. ${verification.message}`
    : `Created run ${run.id}, but the worker is still processing it. ${verification.message}`

  setProgress({
    status: finalStatus,
    message: finalMessage,
    ...sharedProgress,
    verification
  })

  return {
    runId: run.id,
    tabId: tab.id,
    posts,
    diagnostics
  }
}

async function verifyRunProcessing(
  runId: string,
  options: { onProgress?: (verification: CaptureVerification) => void } = {}
): Promise<CaptureVerification> {
  let latest: CaptureVerification = {
    message: "Run created, but verification has not completed yet."
  }

  for (let attempt = 1; attempt <= RUN_VERIFICATION_MAX_ATTEMPTS; attempt += 1) {
    await delay(attempt === 1 ? 1000 : RUN_VERIFICATION_POLL_INTERVAL_MS)

    try {
      const [runResult, candidatesResult, opportunitiesResult] = await Promise.allSettled([
        getJobSearchRun(runId),
        listRunCandidates(runId),
        listRunOpportunities(runId)
      ])
      if (runResult.status === "rejected") {
        throw runResult.reason
      }
      const run = runResult.value
      const candidates = candidatesResult.status === "fulfilled" ? candidatesResult.value : []
      const opportunities = opportunitiesResult.status === "fulfilled" ? opportunitiesResult.value : []
      const verificationWarnings = [
        candidatesResult.status === "rejected" ? `Candidates unavailable: ${errorMessage(candidatesResult.reason)}` : null,
        opportunitiesResult.status === "rejected" ? `Opportunities unavailable: ${errorMessage(opportunitiesResult.reason)}` : null
      ].filter(Boolean)
      const candidatesCount = candidatesResult.status === "fulfilled" ? candidates.length : run.inspected_count
      const opportunitiesCount = opportunitiesResult.status === "fulfilled" ? opportunities.length : undefined

      latest = {
        runStatus: run.status,
        inspectedCount: run.inspected_count,
        acceptedCount: run.accepted_count,
        rejectedCount: run.rejected_count,
        duplicateCount: run.duplicate_count,
        aiFilterInspectedCount: run.ai_filter_inspected_count,
        aiFilterPassedCount: run.ai_filter_passed_count,
        aiFilterRejectedCount: run.ai_filter_rejected_count,
        aiFilterFallbackCount: run.ai_filter_fallback_count,
        aiFilterFailedCount: run.ai_filter_failed_count,
        aiFilterSkippedCount: run.ai_filter_skipped_count,
        aiFilterSamples: candidates.slice(0, 5).map((candidate) => ({
          status: candidate.ai_filter_status,
          reason: candidate.ai_filter_reason || candidate.ai_filter_error_message,
          confidence: candidate.ai_filter_confidence
        })),
        candidatesCount,
        opportunitiesCount,
        message:
          verificationWarnings.length > 0
            ? `${candidatesCount} candidates checked; accepted=${run.accepted_count}, rejected=${run.rejected_count}, duplicates=${run.duplicate_count}. ${verificationWarnings.join(" ")}`
            : opportunities.length > 0
              ? `${opportunities.length} opportunities are visible for this run.`
              : `${candidatesCount} candidates checked; accepted=${run.accepted_count}, rejected=${run.rejected_count}, duplicates=${run.duplicate_count}.`
      }
      options.onProgress?.(latest)

      console.info("[Opportunity Desk] run verification", {
        attempt,
        runId,
        latest,
        sampleCandidates: candidates.slice(0, 5).map((candidate) => ({
          outcome: candidate.outcome,
          opportunityId: candidate.opportunity_id,
          contact: candidate.contact_channel_value,
          rejectionReason: candidate.rejection_reason,
          aiFilterStatus: candidate.ai_filter_status,
          aiFilterReason: candidate.ai_filter_reason
        })),
        sampleOpportunities: opportunities.slice(0, 5).map((opportunity) => opportunity.id)
      })

      if (run.status !== "pending" && run.status !== "running") {
        return latest
      }
    } catch (error) {
      latest = {
        message: error instanceof Error ? error.message : "Could not verify run processing."
      }
      options.onProgress?.(latest)
      console.error("[Opportunity Desk] run verification failed", { runId, error })
    }
  }

  return {
    ...latest,
    message: `${latest.message} Worker verification is still pending; keep this popup open or reopen it to refresh progress.`
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "request failed"
}

chrome.runtime.onMessage.addListener((message: StartCaptureMessage | { type: string; payload?: any }, sender, sendResponse) => {
  if (message.type === "GET_CAPTURE_PROGRESS") {
    sendResponse(latestProgress)
    return false
  }

  if (message.type === FIELD_ASSISTANT_MESSAGE_TYPES.getPageStatus) {
    getFieldAssistantPageStatus(message.payload?.url || sender.tab?.url)
      .then((status) => sendResponse({ ok: true, status }))
      .catch((error: Error) => sendResponse({ ok: false, error: error.message }))
    return true
  }

  if (message.type === FIELD_ASSISTANT_MESSAGE_TYPES.enableCurrent) {
    enableFieldAssistantCurrent(message.payload?.scopeType || "base_domain", message.payload?.url)
      .then((activation) => sendResponse({ ok: true, activation }))
      .catch((error: Error) => sendResponse({ ok: false, error: error.message }))
    return true
  }

  if (
    message.type === FIELD_ASSISTANT_MESSAGE_TYPES.openShell ||
    message.type === FIELD_ASSISTANT_MESSAGE_TYPES.minimizeShell ||
    message.type === FIELD_ASSISTANT_MESSAGE_TYPES.closeShell
  ) {
    sendFieldAssistantMessageToTab({ type: message.type }, sender.tab?.id)
      .then((result) => sendResponse(result))
      .catch((error: Error) => sendResponse({ ok: false, error: error.message }))
    return true
  }

  if (message.type === FIELD_ASSISTANT_MESSAGE_TYPES.generateForField) {
    generateFieldAssistantAnswer(message.payload)
      .then((result) => sendResponse(result))
      .catch((error: Error) => sendResponse({ ok: false, error: error.message }))
    return true
  }

  if (message.type === FIELD_ASSISTANT_MESSAGE_TYPES.listSuggestions) {
    restoreBackgroundAuth()
      .then(() => listFieldResponseSuggestions(message.payload?.keyword || "general_fit"))
      .then((suggestions) => sendResponse({ ok: true, suggestions }))
      .catch((error: Error) => sendResponse({ ok: false, error: error.message }))
    return true
  }

  if (message.type === FIELD_ASSISTANT_MESSAGE_TYPES.saveSuggestion) {
    restoreBackgroundAuth()
      .then(() =>
        saveFieldResponseSuggestion({
          keyword: message.payload?.keyword || "general_fit",
          response_text: message.payload?.answerText || "",
          source: message.payload?.generationId ? "generated" : "edited",
          field_context_summary: message.payload?.fieldContextSummary || null
        })
      )
      .then((suggestion) => sendResponse({ ok: true, suggestion }))
      .catch((error: Error) => sendResponse({ ok: false, error: error.message }))
    return true
  }

  if (message.type === FIELD_ASSISTANT_MESSAGE_TYPES.markSuggestionUsed) {
    restoreBackgroundAuth()
      .then(() => recordFieldResponseSuggestionUsed(message.payload?.suggestionId || ""))
      .then((suggestion) => sendResponse({ ok: true, suggestion }))
      .catch((error: Error) => sendResponse({ ok: false, error: error.message }))
    return true
  }

  if (message.type !== "START_LINKEDIN_CAPTURE") {
    return false
  }

  startCapture(message.payload)
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error: Error) => {
      const message = error.message || "LinkedIn capture failed."
      setProgress({ status: "failed", message })
      sendResponse({ ok: false, error: message })
    })

  return true
})
