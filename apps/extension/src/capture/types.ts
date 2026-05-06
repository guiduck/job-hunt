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
    postsAdded?: number
    noProgressCount?: number
    clickedShowMoreResults?: boolean
    showMoreButtonLabel?: string
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
