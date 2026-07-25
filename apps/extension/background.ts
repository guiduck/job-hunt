import {
  completeLinkedInJobsExternalRun,
  createFieldAssistantActivation,
  createAuthenticatedBrowserRun,
  createLinkedInJobsExternalRun,
  generateFieldAnswerFromInput,
  getJobSearchRun,
  listFieldAssistantActivations,
  listFieldResponseSuggestions,
  listRunCandidates,
  listRunOpportunities,
  recordFieldResponseSuggestionUsed,
  saveFieldResponseSuggestion,
  setApiAccessToken,
  submitLinkedInJobsExternalCandidate,
  updateLinkedInJobsExternalRun
} from "./src/api/client"
import type { FieldAssistantScopeType } from "./src/api/types"
import { buildLinkedInContentSearchUrl, buildLinkedInJobsSearchUrl, normalizeKeywords, parseLinkedInJobsQueryTerms, toCollectionInputs } from "./src/capture/linkedin"
import type {
  CaptureProgress,
  CaptureRequest,
  CaptureResult,
  CaptureVerification,
  ContentCaptureResponse,
  ContentLinkedInJobsCaptureResponse,
  LinkedInJobsExternalRequest,
  LinkedInJobsProgress,
  StartCaptureMessage,
  StartLinkedInJobsExternalMessage
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

let latestLinkedInJobsProgress: LinkedInJobsProgress = {
  status: "idle",
  message: "Ready to inspect LinkedIn Jobs."
}

const RUN_VERIFICATION_MAX_ATTEMPTS = 300
const RUN_VERIFICATION_POLL_INTERVAL_MS = 2000
const LINKEDIN_JOBS_CAPTURE_TIMEOUT_MS = 45 * 60 * 1000

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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })
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
      sortMode: payload.sortMode,
      pastMonthOnly: payload.pastMonthOnly
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
    raw_linkedin_result_count: posts.length,
    raw_linkedin_result_count_source: "extension_content_script",
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
  const finalStatus: CaptureProgress["status"] =
    verification.timedOut || verification.runStatus === "failed" ? "failed" : runReachedTerminalStatus ? "completed" : "processing"
  const finalMessage = runReachedTerminalStatus
    ? `Created run ${run.id}. ${verification.message}`
    : verification.timedOut
      ? `Created run ${run.id}, but worker verification timed out. ${verification.message}`
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
    timedOut: true,
    message: `${latest.message} Worker verification timed out after about 10 minutes. You can start a new capture; the previous run may still finish in the background or be marked failed by the worker timeout.`
  }
}


async function sendLinkedInJobsCaptureMessage(tabId: number, payload: LinkedInJobsExternalRequest): Promise<ContentLinkedInJobsCaptureResponse> {
  let lastError: unknown
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: "CAPTURE_LINKEDIN_JOBS_EXTERNAL",
        payload
      })
      return response as ContentLinkedInJobsCaptureResponse
    } catch (error) {
      lastError = error
      await delay(500)
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not reach the LinkedIn Jobs content script.")
}

function setJobsProgress(progress: LinkedInJobsProgress) {
  latestLinkedInJobsProgress = progress
  console.info("[Opportunity Desk] LinkedIn Jobs progress", progress)
  chrome.runtime.sendMessage({ type: "LINKEDIN_JOBS_EXTERNAL_PROGRESS", payload: progress }).catch(() => undefined)
}

function toApiCandidate(candidate: ContentLinkedInJobsCaptureResponse["candidates"][number]) {
  return {
    linkedin_job_url: candidate.linkedinJobUrl,
    job_title: candidate.jobTitle,
    company_name: candidate.companyName,
    location_text: candidate.locationText,
    apply_button_kind: candidate.applyButtonKind,
    raw_apply_href: candidate.rawApplyHref,
    decoded_apply_url: candidate.decodedApplyUrl,
    canonical_apply_url: candidate.canonicalApplyUrl,
    source_key: candidate.sourceKey,
    outcome: candidate.outcome,
    skip_reason: candidate.skipReason,
    page_number: candidate.pageNumber,
    position_on_page: candidate.positionOnPage
  }
}

function toApiProgress(diagnostics: ContentLinkedInJobsCaptureResponse["diagnostics"], status: "running" | "completed" | "completed_no_results" | "failed" = "running") {
  return {
    status,
    navigation_method: diagnostics.navigationMethod,
    pages_visited: diagnostics.pagesVisited,
    jobs_inspected: diagnostics.jobsInspected,
    external_links_found: diagnostics.externalLinksFound,
    accepted: diagnostics.accepted,
    skipped_easy_apply: diagnostics.skippedEasyApply,
    unsupported_source: diagnostics.unsupportedSource,
    duplicates: diagnostics.duplicates,
    failures: diagnostics.failures,
    safe_message: diagnostics.safeMessage
  }
}

async function startLinkedInJobsExternalCapture(payload: LinkedInJobsExternalRequest) {
  await restoreBackgroundAuth()
  const queryTerms = parseLinkedInJobsQueryTerms(payload.searchText)
  const searchMode = payload.assistedSearchEnabled ? "assisted" : queryTerms.length > 0 ? "classic_keywords" : "default_browse"
  const run = await createLinkedInJobsExternalRun({
    search_text: payload.searchText.trim() || null,
    search_mode: searchMode,
    query_terms: queryTerms,
    date_posted: payload.datePosted,
    sort: payload.sort,
    selected_source_keys: payload.selectedSourceKeys,
    max_pages: payload.maxPages,
    assisted_search_enabled: payload.assistedSearchEnabled
  })

  setJobsProgress({ status: "opening", message: payload.assistedSearchEnabled ? "Opening LinkedIn Jobs home for assisted search..." : "Opening LinkedIn Jobs search...", runId: run.id })
  const directUrl = buildLinkedInJobsSearchUrl({
    searchText: payload.searchText,
    queryTerms,
    mode: searchMode,
    datePosted: payload.datePosted,
    sort: payload.sort
  })
  const url = payload.assistedSearchEnabled ? "https://www.linkedin.com/jobs/" : directUrl
  const tab = await chrome.tabs.create({ active: true, url })
  if (tab.id === undefined) {
    throw new Error("Chrome did not return a tab id for the LinkedIn Jobs search.")
  }
  await waitForTabComplete(tab.id)
  await delay(1200)
  await updateLinkedInJobsExternalRun(run.id, {
    status: "running",
    navigation_method: payload.assistedSearchEnabled ? "jobs_click_path" : "direct_url",
    safe_message: payload.assistedSearchEnabled ? "LinkedIn Jobs home opened; looking for the assisted search entry." : "LinkedIn Jobs tab opened; inspecting rendered job cards."
  })

  setJobsProgress({ status: "capturing", message: payload.assistedSearchEnabled ? "Clicking LinkedIn assisted jobs entry and inspecting cards..." : "Inspecting LinkedIn Jobs cards...", runId: run.id, sourceTabId: tab.id })
  let captured: ContentLinkedInJobsCaptureResponse
  try {
    captured = await withTimeout(
      sendLinkedInJobsCaptureMessage(tab.id, payload),
      LINKEDIN_JOBS_CAPTURE_TIMEOUT_MS,
      "LinkedIn Jobs inspection stopped responding. Try again with fewer pages or reload LinkedIn."
    )
  } catch (error) {
    const message = errorMessage(error)
    await completeLinkedInJobsExternalRun(run.id, {
      status: "failed",
      terminal_reason: "dom_inspection_failed",
      pages_visited: 0,
      jobs_inspected: 0,
      external_links_found: 0,
      accepted: 0,
      skipped_easy_apply: 0,
      unsupported_source: 0,
      duplicates: 0,
      failures: 1,
      navigation_method: payload.assistedSearchEnabled ? "jobs_click_path" : "direct_url"
    }).catch(() => undefined)
    setJobsProgress({ status: "failed", message, runId: run.id, sourceTabId: tab.id })
    throw new Error(message)
  }
  let accepted = 0
  let duplicates = 0
  let failures = captured.diagnostics.failures
  for (const candidate of captured.candidates) {
    try {
      const result = await submitLinkedInJobsExternalCandidate(run.id, toApiCandidate(candidate))
      if (result.outcome === "accepted") accepted += 1
      if (result.outcome === "duplicate") duplicates += 1
    } catch (error) {
      failures += 1
      console.error("[Opportunity Desk] LinkedIn Jobs candidate submit failed", { error, candidate })
    }
  }

  const diagnostics = {
    ...captured.diagnostics,
    accepted,
    duplicates,
    failures
  }
  await updateLinkedInJobsExternalRun(run.id, toApiProgress(diagnostics))
  const terminalStatus = failures > 0 && captured.candidates.length === 0 ? "failed" : accepted > 0 ? "completed" : "completed_no_results"
  const completed = await completeLinkedInJobsExternalRun(run.id, {
    status: terminalStatus,
    terminal_reason: diagnostics.terminalReason,
    pages_visited: diagnostics.pagesVisited,
    jobs_inspected: diagnostics.jobsInspected,
    external_links_found: diagnostics.externalLinksFound,
    accepted: diagnostics.accepted,
    skipped_easy_apply: diagnostics.skippedEasyApply,
    unsupported_source: diagnostics.unsupportedSource,
    duplicates: diagnostics.duplicates,
    failures: diagnostics.failures,
    navigation_method: diagnostics.navigationMethod
  })

  const finalProgress: LinkedInJobsProgress = {
    status: completed.status === "failed" ? "failed" : "completed",
    message: `${completed.status}: ${diagnostics.safeMessage}`,
    runId: run.id,
    sourceTabId: tab.id,
    diagnostics
  }
  setJobsProgress(finalProgress)
  return {
    runId: run.id,
    tabId: tab.id,
    candidates: captured.candidates,
    diagnostics
  }
}
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "request failed"
}

chrome.runtime.onMessage.addListener((message: StartCaptureMessage | StartLinkedInJobsExternalMessage | { type: string; payload?: any }, sender, sendResponse) => {
  if (message.type === "GET_CAPTURE_PROGRESS") {
    sendResponse(latestProgress)
    return false
  }

  if (message.type === "GET_LINKEDIN_JOBS_EXTERNAL_PROGRESS") {
    sendResponse(latestLinkedInJobsProgress)
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

  if (message.type === "START_LINKEDIN_JOBS_EXTERNAL_CAPTURE") {
    startLinkedInJobsExternalCapture(message.payload)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error: Error) => {
        const message = error.message || "LinkedIn Jobs external search failed."
        setJobsProgress({ status: "failed", message })
        sendResponse({ ok: false, error: message })
      })

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
