import {
  createAuthenticatedBrowserRun,
  getJobSearchRun,
  listRunCandidates,
  listRunOpportunities,
  setApiAccessToken
} from "./src/api/client"
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

let latestProgress: CaptureProgress = {
  status: "idle",
  message: "Ready to capture LinkedIn posts."
}

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
      region: payload.region,
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
    search_query: [payload.keywords.trim(), payload.region.trim()].filter(Boolean).join(" "),
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

  const verification = await verifyRunProcessing(run.id)

  setProgress({
    status: "completed",
    message: `Created run ${run.id}. ${verification.message}`,
    postsFound: posts.length,
    runId: run.id,
    sourceTabId: tab.id,
    sampleLabels,
    diagnostics,
    verification
  })

  return {
    runId: run.id,
    tabId: tab.id,
    posts,
    diagnostics
  }
}

async function verifyRunProcessing(runId: string): Promise<CaptureVerification> {
  let latest: CaptureVerification = {
    message: "Run created, but verification has not completed yet."
  }

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    await delay(attempt === 1 ? 1000 : 2000)

    try {
      const [run, candidates, opportunities] = await Promise.all([
        getJobSearchRun(runId),
        listRunCandidates(runId),
        listRunOpportunities(runId)
      ])

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
        candidatesCount: candidates.length,
        opportunitiesCount: opportunities.length,
        message:
          opportunities.length > 0
            ? `${opportunities.length} opportunities are visible for this run.`
            : `${candidates.length} candidates checked; accepted=${run.accepted_count}, rejected=${run.rejected_count}, duplicates=${run.duplicate_count}.`
      }

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
      console.error("[Opportunity Desk] run verification failed", { runId, error })
    }
  }

  return latest
}

chrome.runtime.onMessage.addListener((message: StartCaptureMessage | { type: "GET_CAPTURE_PROGRESS" } | { type: "OPEN_APP_WINDOW" }, _sender, sendResponse) => {
  if (message.type === "GET_CAPTURE_PROGRESS") {
    sendResponse(latestProgress)
    return false
  }

  if (message.type === "OPEN_APP_WINDOW") {
    chrome.windows.create({
      focused: true,
      height: 900,
      type: "popup",
      url: chrome.runtime.getURL("popup.html"),
      width: 520
    })
    sendResponse({ ok: true })
    return false
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
