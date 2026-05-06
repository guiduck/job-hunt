import type { CaptureDiagnostics, ContentCaptureMessage, ContentCaptureResponse, LinkedInCapturedPost } from "../src/capture/types"

export const config = {
  matches: ["https://www.linkedin.com/search/results/content/*"]
}

const POST_SELECTORS = [
  'div[data-urn*="activity"]',
  "div.feed-shared-update-v2",
  "li.reusable-search__result-container",
  'div[role="article"]'
]
const SCROLL_PROGRESS_TIMEOUT_MS = 12000
const SCROLL_PROGRESS_POLL_MS = 500
const MAX_NO_PROGRESS_SCROLLS = 5
const SHOW_MORE_RESULTS_LABELS = [
  "exibir mais resultados",
  "mostrar mais resultados",
  "ver mais resultados",
  "show more results",
  "see more results"
]

type CaptureState = {
  posts: LinkedInCapturedPost[]
  seenTexts: Set<string>
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function findShowMoreResultsButton() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>("button, a[role='button']"))
  return (
    buttons.find((button) => {
      const label = cleanText(`${button.textContent || ""} ${button.getAttribute("aria-label") || ""}`).toLowerCase()
      const isDisabled = button instanceof HTMLButtonElement ? button.disabled : button.getAttribute("aria-disabled") === "true"
      return !isDisabled && SHOW_MORE_RESULTS_LABELS.some((text) => label.includes(text))
    }) || null
  )
}

async function clickShowMoreResultsIfPresent() {
  const button = findShowMoreResultsButton()
  if (!button) {
    return { clicked: false, label: "" }
  }

  const label = cleanText(button.textContent || button.getAttribute("aria-label") || "")
  button.scrollIntoView({ block: "center", behavior: "smooth" })
  await delay(500)
  button.click()
  console.info("[Opportunity Desk] clicked LinkedIn show more results button", { label })
  return { clicked: true, label }
}

function findPostUrl(element: Element) {
  const anchors = Array.from(element.querySelectorAll<HTMLAnchorElement>("a[href]"))
  const postLink = anchors.find((anchor) => {
    const href = anchor.href
    return href.includes("/feed/update/") || href.includes("/posts/") || href.includes("/jobs/view/")
  })

  if (postLink?.href) {
    return cleanLinkedInUrl(postLink.href)
  }

  const urnElement = element.closest("[data-urn]") || element.querySelector("[data-urn]")
  const urn = urnElement?.getAttribute("data-urn")
  if (urn?.includes("urn:li:activity:")) {
    return `https://www.linkedin.com/feed/update/${urn}/`
  }

  return window.location.href
}

function cleanLinkedInUrl(url: string) {
  const parsed = new URL(url)
  parsed.search = ""
  parsed.hash = ""
  return parsed.toString()
}

function findAuthorName(element: Element) {
  const selectors = [
    ".update-components-actor__name",
    ".feed-shared-actor__name",
    ".entity-result__title-text",
    "a[href*='/in/'] span[aria-hidden='true']",
    "a[href*='/company/'] span[aria-hidden='true']"
  ]

  for (const selector of selectors) {
    const text = cleanText(element.querySelector(selector)?.textContent || "")
    if (text && text.length <= 80) {
      return text
    }
  }

  return ""
}

function extractVisiblePosts(
  maxPosts: number,
  diagnostics: CaptureDiagnostics,
  state: CaptureState,
  { recordDiagnostics = true }: { recordDiagnostics?: boolean } = {}
): LinkedInCapturedPost[] {
  for (const selector of POST_SELECTORS) {
    const elements = Array.from(document.querySelectorAll(selector))
    const selectorScan = {
      selector,
      elements: elements.length,
      postsFoundSoFar: state.posts.length
    }
    if (recordDiagnostics) {
      diagnostics.selectorScans.push(selectorScan)
      console.info("[Opportunity Desk] selector scan", selectorScan)
    }

    for (const element of elements) {
      if (state.posts.length >= maxPosts) {
        return state.posts
      }

      const providedText = cleanText(element.textContent || "")
      if (providedText.length < 80) {
        if (recordDiagnostics) {
          diagnostics.skipped.shortText += 1
        }
        continue
      }

      if (state.seenTexts.has(providedText)) {
        if (recordDiagnostics) {
          diagnostics.skipped.duplicateText += 1
        }
        continue
      }

      state.seenTexts.add(providedText)
      const authorName = findAuthorName(element)
      const post = {
        label: authorName || `LinkedIn post ${state.posts.length + 1}`,
        providedText,
        sourceUrl: findPostUrl(element)
      }
      state.posts.push(post)
      const sample = {
        label: post.label,
        sourceUrl: post.sourceUrl,
        textLength: providedText.length,
        textPreview: providedText.slice(0, 180)
      }
      if (recordDiagnostics && diagnostics.samples.length < 8) {
        diagnostics.samples.push(sample)
      }
      if (recordDiagnostics) {
        console.info("[Opportunity Desk] captured post candidate", sample)
      }
    }
  }

  return state.posts
}

async function waitForScrollProgress(
  previousPostsFound: number,
  previousScrollHeight: number,
  maxPosts: number,
  diagnostics: CaptureDiagnostics,
  state: CaptureState
) {
  const startedAt = Date.now()
  let showMoreResult = { clicked: false, label: "" }

  while (Date.now() - startedAt < SCROLL_PROGRESS_TIMEOUT_MS) {
    await delay(SCROLL_PROGRESS_POLL_MS)
    if (!showMoreResult.clicked) {
      const buttonResult = await clickShowMoreResultsIfPresent()
      if (buttonResult.clicked) {
        showMoreResult = buttonResult
        await delay(SCROLL_PROGRESS_POLL_MS)
      }
    }
    const currentPostsFound = extractVisiblePosts(maxPosts, diagnostics, state, { recordDiagnostics: false }).length
    const currentScrollHeight = document.body.scrollHeight
    if (currentPostsFound > previousPostsFound || currentScrollHeight > previousScrollHeight) {
      return {
        progressed: true,
        currentPostsFound,
        currentScrollHeight,
        showMoreResult
      }
    }
  }

  return {
    progressed: false,
    currentPostsFound: extractVisiblePosts(maxPosts, diagnostics, state, { recordDiagnostics: false }).length,
    currentScrollHeight: document.body.scrollHeight,
    showMoreResult
  }
}

async function capturePosts(payload: ContentCaptureMessage["payload"]): Promise<ContentCaptureResponse> {
  const diagnostics: CaptureDiagnostics = {
    startedAt: new Date().toISOString(),
    pageUrl: window.location.href,
    selectorScans: [],
    scrolls: [],
    skipped: {
      duplicateText: 0,
      shortText: 0
    },
    samples: []
  }

  console.info("[Opportunity Desk] capture started in LinkedIn tab", {
    href: window.location.href,
    maxPosts: payload.maxPosts,
    maxScrolls: payload.maxScrolls,
    scrollDelayMs: payload.scrollDelayMs
  })
  const state: CaptureState = {
    posts: [],
    seenTexts: new Set<string>()
  }
  let posts = extractVisiblePosts(payload.maxPosts, diagnostics, state)
  let noProgressCount = 0

  for (let index = 0; index < payload.maxScrolls && posts.length < payload.maxPosts; index += 1) {
    const previousPostsFound = posts.length
    const previousScrollHeight = document.body.scrollHeight
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
    await delay(payload.scrollDelayMs)
    let progress = await waitForScrollProgress(previousPostsFound, previousScrollHeight, payload.maxPosts, diagnostics, state)
    let showMoreResult = progress.showMoreResult
    if (!progress.progressed) {
      showMoreResult = await clickShowMoreResultsIfPresent()
      if (showMoreResult.clicked) {
        await delay(payload.scrollDelayMs)
        progress = await waitForScrollProgress(
          previousPostsFound,
          previousScrollHeight,
          payload.maxPosts,
          diagnostics,
          state
        )
      }
    }
    posts = extractVisiblePosts(payload.maxPosts, diagnostics, state)
    const postsAdded = Math.max(0, posts.length - previousPostsFound)
    noProgressCount = progress.progressed || postsAdded > 0 ? 0 : noProgressCount + 1
    const scrollProgress = {
      scroll: index + 1,
      postsFound: posts.length,
      scrollHeight: document.body.scrollHeight,
      postsAdded,
      noProgressCount,
      clickedShowMoreResults: showMoreResult.clicked,
      showMoreButtonLabel: showMoreResult.label || undefined,
      stoppedReason: noProgressCount >= MAX_NO_PROGRESS_SCROLLS ? "no_new_posts_after_scroll_timeout" : undefined
    }
    diagnostics.scrolls.push(scrollProgress)
    console.info("[Opportunity Desk] scroll capture progress", scrollProgress)

    if (noProgressCount >= MAX_NO_PROGRESS_SCROLLS) {
      console.info("[Opportunity Desk] stopping capture because LinkedIn returned no new posts after scrolling", {
        noProgressCount,
        timeoutMs: SCROLL_PROGRESS_TIMEOUT_MS,
        postsFound: posts.length
      })
      break
    }
  }

  window.scrollTo({ top: 0, behavior: "smooth" })
  console.info("[Opportunity Desk] capture finished in LinkedIn tab", {
    postsFound: posts.length,
    sampleLabels: posts.slice(0, 5).map((post) => post.label),
    diagnostics
  })
  return { posts, diagnostics }
}

chrome.runtime.onMessage.addListener((message: ContentCaptureMessage, _sender, sendResponse) => {
  if (message.type !== "CAPTURE_LINKEDIN_POSTS") {
    return false
  }

  capturePosts(message.payload)
    .then(sendResponse)
    .catch((error: Error) => {
      console.error("[Opportunity Desk] capture failed in LinkedIn tab", error)
      sendResponse({
        posts: [],
        diagnostics: {
          startedAt: new Date().toISOString(),
          pageUrl: window.location.href,
          selectorScans: [],
          scrolls: [],
          skipped: { duplicateText: 0, shortText: 0 },
          samples: []
        },
        error: error.message
      })
    })

  return true
})
