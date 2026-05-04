export type LinkedInCapturedPost = {
  label: string
  providedText: string
  sourceUrl: string
}

export type CaptureRequest = {
  keywords: string
  region: string
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
  }>
  skipped: {
    duplicateText: number
    shortText: number
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
