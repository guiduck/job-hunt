export type LinkedInCapturedPost = {
  label: string
  providedText: string
  sourceUrl: string
}

export function createLinkedInCapturedPostFixture(overrides: Partial<LinkedInCapturedPost> = {}): LinkedInCapturedPost {
  return {
    label: "LinkedIn post #1",
    providedText: "Example Co is hiring a remote TypeScript developer. Email jobs@example.com",
    sourceUrl: "https://www.linkedin.com/feed/update/example",
    ...overrides
  }
}

export type CaptureRequest = {
  keywords: string
  region: string
  aiFiltersEnabled: boolean
  acceptedRegions: string
  excludedRegions: string
  remoteOnly: boolean
  excludeOnsite: boolean
  sortMode: "recent" | "relevant"
  pastMonthOnly: boolean
  maxPosts: number
  maxScrolls: number
  scrollDelayMs: number
}

export type CaptureResult = {
  runId: string
  tabId: number
  posts: LinkedInCapturedPost[]
  diagnostics?: CaptureDiagnostics
}

export type CaptureProgress = {
  status: "idle" | "opening" | "capturing" | "submitting" | "processing" | "completed" | "failed"
  message: string
  postsFound?: number
  runId?: string
  sourceTabId?: number
  sampleLabels?: string[]
  diagnostics?: CaptureDiagnostics
  verification?: CaptureVerification
}

export type CaptureDiagnostics = {
  startedAt: string
  pageUrl: string
  selectorScans: Array<{
    selector: string
    elements: number
    postsFoundSoFar: number
  }>
  scrolls: Array<{
    scroll: number
    postsFound: number
    scrollHeight: number
    scrollTop?: number
    clientHeight?: number
    scrollTarget?: string
    scrollRange?: number
    postsAdded?: number
    noProgressCount?: number
    clickedShowMoreResults?: boolean
    showMoreButtonLabel?: string
    recoveryScrolls?: number
    stoppedReason?: string
  }>
  skipped: {
    duplicateText: number
    shortText: number
    filteredOut?: number
  }
  samples: Array<{
    label: string
    sourceUrl: string
    textLength: number
    textPreview: string
  }>
}

export type CaptureVerification = {
  runStatus?: string
  timedOut?: boolean
  inspectedCount?: number
  acceptedCount?: number
  rejectedCount?: number
  duplicateCount?: number
  aiFilterInspectedCount?: number
  aiFilterPassedCount?: number
  aiFilterRejectedCount?: number
  aiFilterFallbackCount?: number
  aiFilterFailedCount?: number
  aiFilterSkippedCount?: number
  aiFilterSamples?: Array<{
    status: string
    reason?: string | null
    confidence?: number | null
  }>
  candidatesCount?: number
  opportunitiesCount?: number
  message: string
}

export type StartCaptureMessage = {
  type: "START_LINKEDIN_CAPTURE"
  payload: CaptureRequest
}

export type ContentCaptureMessage = {
  type: "CAPTURE_LINKEDIN_POSTS"
  payload: {
    maxPosts: number
    maxScrolls: number
    scrollDelayMs: number
  }
}

export type ContentCaptureResponse = {
  posts: LinkedInCapturedPost[]
  diagnostics: CaptureDiagnostics
}

export type LinkedInJobsTerminalReason =
  | "max_pages_reached"
  | "no_next_page"
  | "no_renderable_results"
  | "linkedin_login_required"
  | "navigation_failed"
  | "pagination_stalled"
  | "dom_inspection_failed"
  | "assisted_entry_unavailable"
  | "assisted_navigation_failed"
  | "cancelled"

export type LinkedInJobsExternalRequest = {
  searchText: string
  selectedSourceKeys: string[]
  maxPages: number
  datePosted: "any_time" | "past_month" | "past_week" | "past_24_hours"
  sort: "relevant" | "most_recent"
  assistedSearchEnabled: boolean
  sources: Array<{ key: string; name: string; domain: string; active: boolean }>
}

export type LinkedInJobsCounters = {
  pagesVisited: number
  jobsInspected: number
  externalLinksFound: number
  accepted: number
  skippedEasyApply: number
  unsupportedSource: number
  duplicates: number
  failures: number
}

export type LinkedInJobsInspectedCandidate = {
  linkedinJobUrl: string | null
  jobTitle: string | null
  companyName: string | null
  locationText: string | null
  applyButtonKind: "external" | "easy_apply" | "missing" | "unknown"
  rawApplyHref: string | null
  decodedApplyUrl: string | null
  canonicalApplyUrl: string | null
  sourceKey: string | null
  outcome:
    | "accepted"
    | "skipped_easy_apply"
    | "unsupported_source"
    | "duplicate"
    | "failed_decode"
    | "missing_external_apply"
    | "inspection_failed"
  skipReason: string | null
  pageNumber: number
  positionOnPage: number | null
}

export type LinkedInJobsDiagnostics = LinkedInJobsCounters & {
  startedAt: string
  pageUrl: string
  navigationMethod: "direct_url" | "direct_url_with_geo" | "jobs_click_path" | "assisted_entry" | "unknown"
  terminalReason: LinkedInJobsTerminalReason
  safeMessage: string
  samples: Array<{ title: string | null; company: string | null; outcome: string; applyUrl: string | null; rawApplyHref?: string | null; sourceKey?: string | null; skipReason?: string | null }>
}

export type LinkedInJobsExternalResult = {
  runId?: string
  tabId: number
  candidates: LinkedInJobsInspectedCandidate[]
  diagnostics: LinkedInJobsDiagnostics
}

export type LinkedInJobsProgress = {
  status: "idle" | "opening" | "capturing" | "submitting" | "completed" | "failed"
  message: string
  runId?: string
  sourceTabId?: number
  diagnostics?: LinkedInJobsDiagnostics
}

export type StartLinkedInJobsExternalMessage = {
  type: "START_LINKEDIN_JOBS_EXTERNAL_CAPTURE"
  payload: LinkedInJobsExternalRequest
}

export type ContentLinkedInJobsCaptureMessage = {
  type: "CAPTURE_LINKEDIN_JOBS_EXTERNAL"
  payload: LinkedInJobsExternalRequest
}

export type ContentLinkedInJobsCaptureResponse = {
  candidates: LinkedInJobsInspectedCandidate[]
  diagnostics: LinkedInJobsDiagnostics
}
