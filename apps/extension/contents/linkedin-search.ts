import { canonicalizeExternalApplicationUrl, decodeLinkedInSafetyRedirect, diagnoseCuratedExternalSourceMatch } from "../src/capture/linkedin"
import type { CaptureDiagnostics, ContentCaptureMessage, ContentCaptureResponse, ContentLinkedInJobsCaptureMessage, ContentLinkedInJobsCaptureResponse, LinkedInCapturedPost, LinkedInJobsCounters, LinkedInJobsDiagnostics, LinkedInJobsInspectedCandidate, LinkedInJobsProgress } from "../src/capture/types"

export const config = {
  matches: ["https://www.linkedin.com/search/results/content/*", "https://www.linkedin.com/jobs/*"]
}

const POST_SELECTORS = [
  'div[data-urn*="activity"]',
  "div.feed-shared-update-v2",
  "li.reusable-search__result-container",
  "li.search-results__result-item",
  "div.entity-result",
  '[data-view-name="search-entity-result-universal-template"]',
  'li[data-view-name*="search"]',
  'div[role="article"]'
]
const SCROLL_PROGRESS_TIMEOUT_MS = 12000
const SCROLL_PROGRESS_POLL_MS = 500
const INITIAL_RESULTS_TIMEOUT_MS = 15000
const MAX_NO_PROGRESS_SCROLLS = 5
const STALLED_SCROLL_RECOVERY_UP_SCROLLS = 2
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

type ScrollMetrics = {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
  maxScrollTop: number
  targetLabel: string
}

type ScrollTarget = {
  element: Element | Window
  isWindow: boolean
  label: string
  score: number
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function elementLabel(element: Element | null) {
  if (!element) {
    return "unknown"
  }
  const id = element.id ? `#${element.id}` : ""
  const className =
    typeof (element as HTMLElement).className === "string"
      ? `.${(element as HTMLElement).className.split(/\s+/).filter(Boolean).slice(0, 3).join(".")}`
      : ""
  return `${element.tagName.toLowerCase()}${id}${className}` || element.tagName.toLowerCase()
}

function isVisibleElement(element: Element) {
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight
}

function getWindowScrollMetrics(): ScrollMetrics {
  const root = document.scrollingElement || document.documentElement || document.body
  const scrollHeight = Math.max(root?.scrollHeight || 0, document.documentElement.scrollHeight || 0, document.body.scrollHeight || 0)
  const clientHeight = window.innerHeight || document.documentElement.clientHeight || root?.clientHeight || 0
  return {
    scrollTop: window.scrollY || root?.scrollTop || document.documentElement.scrollTop || document.body.scrollTop || 0,
    scrollHeight,
    clientHeight,
    maxScrollTop: Math.max(0, scrollHeight - clientHeight),
    targetLabel: "window"
  }
}

function getElementScrollMetrics(element: Element, label = elementLabel(element)): ScrollMetrics {
  const htmlElement = element as HTMLElement
  const scrollHeight = htmlElement.scrollHeight || 0
  const clientHeight = htmlElement.clientHeight || 0
  return {
    scrollTop: htmlElement.scrollTop || 0,
    scrollHeight,
    clientHeight,
    maxScrollTop: Math.max(0, scrollHeight - clientHeight),
    targetLabel: label
  }
}

function findBestScrollTarget(): ScrollTarget {
  const windowMetrics = getWindowScrollMetrics()
  let best: ScrollTarget = {
    element: window,
    isWindow: true,
    label: "window",
    score: windowMetrics.maxScrollTop
  }

  const candidates = Array.from(document.querySelectorAll("main, [role='main'], .scaffold-layout__main, .scaffold-layout__content, .scaffold-finite-scroll, .search-results-container, .application-outlet, div, section"))
  for (const element of candidates) {
    if (!isVisibleElement(element)) {
      continue
    }

    const metrics = getElementScrollMetrics(element)
    if (metrics.maxScrollTop <= 24) {
      continue
    }

    const style = window.getComputedStyle(element)
    const overflowSignal = /(auto|scroll|overlay)/i.test(`${style.overflowY} ${style.overflow}`)
    const postSignal = POST_SELECTORS.some((selector) => Boolean(element.querySelector(selector)))
    const rect = element.getBoundingClientRect()
    const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0))
    const score = metrics.maxScrollTop + visibleHeight + (postSignal ? 2000 : 0) + (overflowSignal ? 600 : 0)

    if (score > best.score) {
      best = {
        element,
        isWindow: false,
        label: elementLabel(element),
        score
      }
    }
  }

  return best
}

function getScrollMetrics(target = findBestScrollTarget()): ScrollMetrics {
  return target.isWindow ? getWindowScrollMetrics() : getElementScrollMetrics(target.element as Element, target.label)
}

function hasScrollablePage() {
  const metrics = getScrollMetrics()
  return metrics.maxScrollTop > 24
}

function dispatchWheel(target: ScrollTarget, deltaY: number) {
  const eventTarget = target.isWindow ? document.body : target.element
  eventTarget.dispatchEvent(
    new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaMode: WheelEvent.DOM_DELTA_PIXEL,
      deltaY,
      clientX: Math.floor(window.innerWidth / 2),
      clientY: Math.floor(window.innerHeight / 2)
    })
  )
}

function scrollPageBy(direction: "up" | "down") {
  const target = findBestScrollTarget()
  const before = getScrollMetrics(target)
  const step = Math.max(Math.floor(before.clientHeight * 0.85), 600)
  const deltaY = direction === "down" ? step : -step
  const targetTop =
    direction === "down"
      ? Math.min(before.maxScrollTop, before.scrollTop + step)
      : Math.max(0, before.scrollTop - step)

  dispatchWheel(target, deltaY)
  if (target.isWindow) {
    window.scrollTo({ top: targetTop, behavior: "auto" })
    document.documentElement.scrollTop = targetTop
    document.body.scrollTop = targetTop
  } else {
    const element = target.element as HTMLElement
    element.scrollTop = targetTop
    element.scrollTo({ top: targetTop, behavior: "auto" })
  }

  return { before, targetTop, direction }
}

function scrollPageDown() {
  return scrollPageBy("down")
}

function scrollPageUp() {
  return scrollPageBy("up")
}

function scrollPageToTop() {
  const target = findBestScrollTarget()
  if (target.isWindow) {
    window.scrollTo({ top: 0, behavior: "auto" })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    return
  }

  const element = target.element as HTMLElement
  element.scrollTop = 0
  element.scrollTo({ top: 0, behavior: "auto" })
}

function countReadablePostElements() {
  const elements = getPostElements()
  const readable = elements.filter((element) => cleanText(element.textContent || "").length >= 80).length
  return { elements: elements.length, readable }
}

function getPostElements() {
  const elements: Element[] = []
  const seen = new Set<Element>()

  for (const selector of POST_SELECTORS) {
    for (const element of Array.from(document.querySelectorAll(selector))) {
      if (!seen.has(element)) {
        seen.add(element)
        elements.push(element)
      }
    }
  }

  if (elements.length > 0) {
    return elements
  }

  const main = document.querySelector("main") || document.querySelector("[role='main']") || document.body
  for (const element of Array.from(main.querySelectorAll("li, article, div"))) {
    const text = cleanText(element.textContent || "")
    const hasActionText = /(gostar|curtir|comentar|compartilhar|enviar|seguir|like|comment|share|send|follow)/i.test(text)
    const hasResultText = /(vaga|hiring|remote|remoto|developer|frontend|backend|react|typescript|engenheiro|desenvolvedor)/i.test(text)
    if (text.length >= 120 && hasActionText && hasResultText && isVisibleElement(element)) {
      elements.push(element)
    }
  }

  return elements
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
    "[data-test-app-aware-link] span[aria-hidden='true']",
    "a[href*='/in/'] span[aria-hidden='true']",
    "a[href*='/company/'] span[aria-hidden='true']",
    "a[href*='/in/']",
    "a[href*='/company/']"
  ]

  for (const selector of selectors) {
    const text = sanitizeAuthorName(element.querySelector(selector)?.textContent || "")
    if (text) {
      return text
    }
  }

  const profileAnchor = Array.from(element.querySelectorAll<HTMLAnchorElement>("a[href*='/in/'], a[href*='/company/']")).find(
    (anchor) => sanitizeAuthorName(anchor.textContent || anchor.getAttribute("aria-label") || "")
  )
  const profileText = sanitizeAuthorName(profileAnchor?.textContent || profileAnchor?.getAttribute("aria-label") || "")
  if (profileText) {
    return profileText
  }

  return ""
}

function sanitizeAuthorName(value: string) {
  const text = cleanText(value)
    .replace(/^view\s+/i, "")
    .replace(/\s+profile$/i, "")
    .replace(/\s+perfil$/i, "")
  const firstLine = cleanText(text.split(/\b(?:1st|2nd|3rd|seguidores?|followers?|follow|seguir|conex\S*o)\b/i, 1)[0] || "")
  if (!firstLine || firstLine.length > 80) {
    return ""
  }
  if (/^(like|comment|share|send|follow|gostei|comentar|compartilhar|enviar|seguir)$/i.test(firstLine)) {
    return ""
  }
  return firstLine
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

  const fallbackElements = getPostElements()
  if (recordDiagnostics) {
    const selectorScan = {
      selector: "fallback:visible-search-result-blocks",
      elements: fallbackElements.length,
      postsFoundSoFar: state.posts.length
    }
    diagnostics.selectorScans.push(selectorScan)
    console.info("[Opportunity Desk] selector scan", selectorScan)
  }

  for (const element of fallbackElements) {
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

  return state.posts
}

async function waitForScrollProgress(
  previousPostsFound: number,
  previousMetrics: ScrollMetrics,
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
    const currentMetrics = getScrollMetrics()
    if (
      currentPostsFound > previousPostsFound ||
      currentMetrics.scrollHeight > previousMetrics.scrollHeight ||
      currentMetrics.scrollTop > previousMetrics.scrollTop + 8
    ) {
      return {
        progressed: true,
        currentPostsFound,
        currentMetrics,
        showMoreResult
      }
    }
  }

  return {
    progressed: false,
    currentPostsFound: extractVisiblePosts(maxPosts, diagnostics, state, { recordDiagnostics: false }).length,
    currentMetrics: getScrollMetrics(),
    showMoreResult
  }
}

async function waitForInitialReadablePosts(maxPosts: number, diagnostics: CaptureDiagnostics, state: CaptureState) {
  const startedAt = Date.now()
  let lastCount = countReadablePostElements()

  while (Date.now() - startedAt < INITIAL_RESULTS_TIMEOUT_MS) {
    lastCount = countReadablePostElements()
    if (lastCount.readable > 0) {
      const posts = extractVisiblePosts(maxPosts, diagnostics, state)
      console.info("[Opportunity Desk] LinkedIn initial posts ready", {
        postsFound: posts.length,
        waitedMs: Date.now() - startedAt,
        ...lastCount
      })
      return posts
    }

    await delay(SCROLL_PROGRESS_POLL_MS)
  }

  console.info("[Opportunity Desk] LinkedIn initial posts wait timed out", {
    waitedMs: Date.now() - startedAt,
    ...lastCount,
    scroll: getScrollMetrics()
  })
  return extractVisiblePosts(maxPosts, diagnostics, state, { recordDiagnostics: false })
}

async function recoverStalledScroll(
  previousPostsFound: number,
  previousMetrics: ScrollMetrics,
  maxPosts: number,
  diagnostics: CaptureDiagnostics,
  state: CaptureState,
  scrollDelayMs: number
) {
  console.info("[Opportunity Desk] attempting LinkedIn stalled scroll recovery", {
    upScrolls: STALLED_SCROLL_RECOVERY_UP_SCROLLS,
    previousPostsFound,
    previousMetrics
  })

  for (let index = 0; index < STALLED_SCROLL_RECOVERY_UP_SCROLLS; index += 1) {
    const recoveryUpAttempt = scrollPageUp()
    console.info("[Opportunity Desk] LinkedIn recovery scroll up", {
      recoveryScroll: index + 1,
      from: recoveryUpAttempt.before.scrollTop,
      to: recoveryUpAttempt.targetTop,
      target: recoveryUpAttempt.before.targetLabel
    })
    await delay(scrollDelayMs)
  }

  const recoveryDownAttempt = scrollPageDown()
  await delay(scrollDelayMs)
  const progress = await waitForScrollProgress(previousPostsFound, previousMetrics, maxPosts, diagnostics, state)
  console.info("[Opportunity Desk] LinkedIn recovery scroll down complete", {
    from: recoveryDownAttempt.before.scrollTop,
    to: recoveryDownAttempt.targetTop,
    target: recoveryDownAttempt.before.targetLabel,
    progressed: progress.progressed,
    postsFound: progress.currentPostsFound,
    scrollHeight: progress.currentMetrics.scrollHeight,
    scrollTop: progress.currentMetrics.scrollTop
  })
  return progress
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
  let posts = await waitForInitialReadablePosts(payload.maxPosts, diagnostics, state)
  posts = extractVisiblePosts(payload.maxPosts, diagnostics, state)
  let noProgressCount = 0

  for (let index = 0; index < payload.maxScrolls && posts.length < payload.maxPosts; index += 1) {
    const previousPostsFound = posts.length
    const scrollAttempt = scrollPageDown()
    await delay(payload.scrollDelayMs)
    let progress = await waitForScrollProgress(previousPostsFound, scrollAttempt.before, payload.maxPosts, diagnostics, state)
    let showMoreResult = progress.showMoreResult
    let recoveryScrolls = 0
    if (!progress.progressed || !hasScrollablePage()) {
      showMoreResult = await clickShowMoreResultsIfPresent()
      if (showMoreResult.clicked) {
        await delay(payload.scrollDelayMs)
        progress = await waitForScrollProgress(
          previousPostsFound,
          scrollAttempt.before,
          payload.maxPosts,
          diagnostics,
          state
        )
      }
    }
    if (!progress.progressed) {
      recoveryScrolls = STALLED_SCROLL_RECOVERY_UP_SCROLLS + 1
      progress = await recoverStalledScroll(
        previousPostsFound,
        scrollAttempt.before,
        payload.maxPosts,
        diagnostics,
        state,
        payload.scrollDelayMs
      )
      showMoreResult = progress.showMoreResult.clicked ? progress.showMoreResult : showMoreResult
    }
    posts = extractVisiblePosts(payload.maxPosts, diagnostics, state)
    const postsAdded = Math.max(0, posts.length - previousPostsFound)
    noProgressCount = progress.progressed || postsAdded > 0 ? 0 : noProgressCount + 1
    const scrollProgress = {
      scroll: index + 1,
      postsFound: posts.length,
      scrollHeight: progress.currentMetrics.scrollHeight,
      scrollTop: progress.currentMetrics.scrollTop,
      clientHeight: progress.currentMetrics.clientHeight,
      scrollTarget: progress.currentMetrics.targetLabel,
      scrollRange: progress.currentMetrics.maxScrollTop,
      postsAdded,
      noProgressCount,
      clickedShowMoreResults: showMoreResult.clicked,
      showMoreButtonLabel: showMoreResult.label || undefined,
      recoveryScrolls,
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

const JOB_CARD_SELECTORS = [
  "[componentkey^='job-card-component']",
  "[componentkey*='job-card-component']",
  "li.jobs-search-results__list-item",
  "div.job-card-container",
  "li[data-occludable-job-id]",
  "div[data-job-id]",
  "li.scaffold-layout__list-item",
  "li[class*=jobs-search-results]",
  "div[class*=job-card]",
  "li[data-view-name*=job]",
  "div[data-view-name*=job]"
]
const NEXT_PAGE_LABELS = ["next", "proxima", "pr\u00f3xima", "avancar", "avan\u00e7ar"]
const ASSISTED_JOBS_SHOW_ALL_LABELS = ["exibir todas", "exibir todos", "mostrar todas", "mostrar todos", "show all", "see all", "view all"]
const ASSISTED_JOBS_SECTION_LABELS = ["vagas com base nas suas prefer\u00eancias", "vagas com base nas suas preferencias", "jobs based on your preferences"]
const JOBS_INITIAL_TIMEOUT_MS = 15000
const ASSISTED_JOBS_ENTRY_TIMEOUT_MS = 20000
const JOBS_PAGE_DELAY_MS = 1500
const JOBS_CARD_INSPECTION_DELAY_MS = 450
const JOBS_APPLY_STATE_TIMEOUT_MS = 6000
const JOBS_APPLY_STATE_POLL_MS = 250
const JOBS_MAX_SCROLLS_PER_PAGE = 24
const JOBS_MAX_NO_PROGRESS_SCROLLS = 4

function jobText(element: Element | null) {
  return cleanText(element?.textContent || "")
}

function textIncludesAny(text: string, labels: string[]) {
  const normalized = cleanText(text).toLowerCase()
  return labels.some((label) => normalized.includes(label))
}

function findAssistedJobsShowAllButton() {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>("button, a[href], a[role='button']"))
    .filter((element) => {
      const label = `${element.textContent || ""} ${element.getAttribute("aria-label") || ""}`
      const disabled = element instanceof HTMLButtonElement ? element.disabled : element.getAttribute("aria-disabled") === "true"
      return !disabled && textIncludesAny(label, ASSISTED_JOBS_SHOW_ALL_LABELS) && isVisibleElement(element)
    })

  return (
    candidates.find((element) => {
      const container = element.closest("section, article, div")
      return container ? textIncludesAny(container.textContent || "", ASSISTED_JOBS_SECTION_LABELS) : false
    }) || candidates[0] || null
  )
}

async function navigateViaAssistedJobsEntry() {
  const startedAt = Date.now()
  while (Date.now() - startedAt < ASSISTED_JOBS_ENTRY_TIMEOUT_MS) {
    if (/\/jobs\/(search-results|search)\//i.test(window.location.pathname)) {
      return { ok: true, clicked: false, message: "LinkedIn already rendered assisted jobs results." }
    }

    const button = findAssistedJobsShowAllButton()
    if (button) {
      const beforeHref = window.location.href
      button.scrollIntoView({ block: "center", behavior: "auto" })
      await delay(300)
      button.click()
      console.info("[Opportunity Desk] clicked LinkedIn assisted jobs entry", { label: cleanText(button.textContent || button.getAttribute("aria-label") || "") })

      const navigationStartedAt = Date.now()
      while (Date.now() - navigationStartedAt < ASSISTED_JOBS_ENTRY_TIMEOUT_MS) {
        await delay(500)
        if (window.location.href !== beforeHref || /\/jobs\/(search-results|search)\//i.test(window.location.pathname)) {
          return { ok: true, clicked: true, message: "LinkedIn assisted jobs entry opened search results." }
        }
      }

      return { ok: false, clicked: true, message: "LinkedIn did not navigate after clicking the assisted jobs entry." }
    }

    await delay(500)
  }

  return { ok: false, clicked: false, message: "Could not find the LinkedIn 'Exibir todas' assisted jobs entry." }
}

function emitLinkedInJobsContentProgress(
  progress: Partial<LinkedInJobsDiagnostics> & {
    safeMessage: string
    status?: LinkedInJobsProgress["status"]
    terminalReason?: LinkedInJobsDiagnostics["terminalReason"]
  }
) {
  const diagnostics: LinkedInJobsDiagnostics = {
    startedAt: progress.startedAt || new Date().toISOString(),
    pageUrl: progress.pageUrl || window.location.href,
    navigationMethod: progress.navigationMethod || "unknown",
    terminalReason: progress.terminalReason || "max_pages_reached",
    safeMessage: progress.safeMessage,
    pagesVisited: progress.pagesVisited || 0,
    jobsInspected: progress.jobsInspected || 0,
    externalLinksFound: progress.externalLinksFound || 0,
    accepted: progress.accepted || 0,
    skippedEasyApply: progress.skippedEasyApply || 0,
    unsupportedSource: progress.unsupportedSource || 0,
    duplicates: progress.duplicates || 0,
    failures: progress.failures || 0,
    samples: progress.samples || []
  }
  chrome.runtime.sendMessage({ type: "LINKEDIN_JOBS_EXTERNAL_PROGRESS", payload: { status: progress.status || "capturing", message: progress.safeMessage, diagnostics } }).catch(() => undefined)
}

function hasLinkedInJobResultSignal(element: Element) {
  const text = jobText(element)
  const hasJobLink = Boolean(element.querySelector("a[href*='/jobs/view/'], a[href*='currentJobId=']"))
  const explicitCards = JOB_CARD_SELECTORS.reduce((count, selector) => count + element.querySelectorAll(selector).length, 0)
  const textLooksLikeJobs = /(candidat|candidate|remoto|remote|h\u00edbrido|hybrid|tempo integral|full.?time|desenvolvedor|developer|engineer|engenheiro|software|frontend|front-end|fullstack|full-stack)/i.test(text)
  const hasSduiJobCard = Boolean(element.querySelector("[componentkey^='job-card-component'], [componentkey*='job-card-component']"))
  return hasSduiJobCard || hasJobLink || explicitCards >= 2 || (textLooksLikeJobs && text.length >= 80)
}

function findJobsListRoot(): Element | null {
  const selectors = [
    ".jobs-search-results-list",
    ".scaffold-layout__list",
    ".scaffold-layout__list-container",
    ".jobs-search-results-list__list",
    "ul.jobs-search-results__list",
    "[class*='jobs-search-results-list']",
    "[class*='scaffold-layout__list']"
  ]

  const explicitRoot = selectors.map((selector) => document.querySelector(selector)).find((element) => {
    if (!element || !isVisibleElement(element)) return false
    return hasLinkedInJobResultSignal(element)
  })
  if (explicitRoot) return explicitRoot

  const candidates = Array.from(document.querySelectorAll<HTMLElement>("main, section, div, ul"))
    .filter((element) => {
      if (!isVisibleElement(element) || !hasLinkedInJobResultSignal(element)) return false
      const rect = element.getBoundingClientRect()
      if (rect.height < 240 || rect.width < 240) return false
      if (rect.left > window.innerWidth * 0.55) return false
      if (rect.width > window.innerWidth * 0.65) return false
      return element.scrollHeight > element.clientHeight + 24 || element.querySelectorAll("[componentkey^='job-card-component'], [componentkey*='job-card-component'], li, article, div[data-job-id], div.job-card-container").length >= 2
    })
    .map((element) => {
      const rect = element.getBoundingClientRect()
      const scrollScore = Math.max(0, element.scrollHeight - element.clientHeight)
      const jobSignalScore = JOB_CARD_SELECTORS.reduce((count, selector) => count + element.querySelectorAll(selector).length, 0)
      return { element, score: scrollScore + jobSignalScore * 150 + Math.max(0, 700 - rect.width) }
    })
    .sort((left, right) => right.score - left.score)

  return candidates[0]?.element || null
}

function isInsideJobResultsList(element: Element) {
  const root = findJobsListRoot()
  return Boolean(root && root.contains(element))
}
function addJobCard(cards: Element[], seen: Set<Element>, element: Element | null) {
  if (!element || seen.has(element) || !isVisibleElement(element) || !isInsideJobResultsList(element)) {
    return
  }
  const text = jobText(element)
  const hasJobLink = Boolean(element.querySelector("a[href*='/jobs/view/'], a[href*='currentJobId=']"))
  const hasJobText = /(candidat|candidate|remoto|remote|h\u00edbrido|hybrid|tempo integral|full.?time|desenvolvedor|developer|engineer|engenheiro|software|frontend|front-end|fullstack|full-stack)/i.test(text)
  if (text.length > 1800 || (!hasJobLink && !hasJobText)) {
    return
  }
  seen.add(element)
  cards.push(element)
}

function findJobCardFromAnchor(anchor: HTMLAnchorElement) {
  const selectors = [
    "[componentkey^='job-card-component']",
    "[componentkey*='job-card-component']",
    "li.jobs-search-results__list-item",
    "li.scaffold-layout__list-item",
    "li[data-occludable-job-id]",
    "div.job-card-container",
    "div[data-job-id]",
    "li",
    "article",
    "div"
  ]
  for (const selector of selectors) {
    const candidate = anchor.closest(selector)
    if (candidate && jobText(candidate).length >= 20) {
      return candidate
    }
  }
  return anchor
}

function findJobsCards() {
  const root = findJobsListRoot()
  if (!root) {
    console.info("[Opportunity Desk] LinkedIn Jobs card scan skipped: no left results list root", { url: window.location.href })
    return []
  }

  const seen = new Set<Element>()
  const cards: Element[] = []
  for (const selector of JOB_CARD_SELECTORS) {
    for (const element of Array.from(root.querySelectorAll(selector))) {
      addJobCard(cards, seen, element)
    }
  }

  for (const anchor of Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href*='/jobs/view/'], a[href*='currentJobId=']"))) {
    addJobCard(cards, seen, findJobCardFromAnchor(anchor))
  }

  if (cards.length === 0) {
    for (const element of Array.from(root.querySelectorAll("[componentkey^='job-card-component'], [componentkey*='job-card-component'], li, article, div[data-job-id], div[data-view-name*=job], div.job-card-container, div[class*=job-card]"))) {
      addJobCard(cards, seen, element)
    }
  }

  console.info("[Opportunity Desk] LinkedIn Jobs card scan", {
    cards: cards.length,
    jobLinks: root.querySelectorAll("a[href*='/jobs/view/'], a[href*='currentJobId=']").length,
    url: window.location.href
  })
  return cards
}
function findJobsScrollTarget(cards: Element[]) {
  const root = findJobsListRoot()
  if (!root) return null

  const rootCandidates = root instanceof HTMLElement ? [root] : []
  const candidates = rootCandidates.concat(Array.from(root.querySelectorAll<HTMLElement>(".jobs-search-results-list, .scaffold-layout__list, .scaffold-layout__list-container, .jobs-search-results-list__list, div, ul")))
    .filter((element) => {
      if (!isVisibleElement(element)) return false
      if (element.scrollHeight <= element.clientHeight + 24) return false
      return cards.some((card) => element.contains(card))
    })
    .map((element) => {
      const rect = element.getBoundingClientRect()
      const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0))
      return { element, score: element.scrollHeight - element.clientHeight + visibleHeight }
    })
    .sort((left, right) => right.score - left.score)

  return candidates[0]?.element || null
}

function scrollJobsResultsList(cards: Element[]) {
  const target = findJobsScrollTarget(cards)
  if (!target) {
    const before = window.scrollY
    window.scrollBy({ top: Math.max(600, Math.floor(window.innerHeight * 0.7)), behavior: "auto" })
    return { targetLabel: "window", before, after: window.scrollY }
  }

  const before = target.scrollTop
  const step = Math.max(420, Math.floor(target.clientHeight * 0.75))
  target.scrollTop = Math.min(target.scrollHeight - target.clientHeight, target.scrollTop + step)
  target.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: step }))
  return { targetLabel: elementLabel(target), before, after: target.scrollTop }
}
function findJobTitle(card: Element) {
  const selectors = ["[componentkey^='job-card-component'] p", "[componentkey*='job-card-component'] p", ".job-card-list__title", ".job-card-container__link", "a[href*='/jobs/view/']", "strong"]
  for (const selector of selectors) {
    const text = jobText(card.querySelector(selector))
    if (text) return text.slice(0, 500)
  }
  return jobText(card).split("\n")[0]?.slice(0, 500) || null
}

function findJobCompany(card: Element) {
  const selectors = [".job-card-container__primary-description", ".artdeco-entity-lockup__subtitle", "[class*='company']"]
  for (const selector of selectors) {
    const text = jobText(card.querySelector(selector))
    if (text) return text.slice(0, 255)
  }
  return null
}

function findJobLocation(card: Element) {
  const selectors = [".job-card-container__metadata-item", ".artdeco-entity-lockup__caption", "[class*='location']"]
  for (const selector of selectors) {
    const text = jobText(card.querySelector(selector))
    if (text) return text.slice(0, 255)
  }
  return null
}

function addSelectableJobCardTarget(targets: HTMLElement[], element: Element | null | undefined) {
  if (!(element instanceof HTMLElement)) return
  if (!isVisibleElement(element) || !isInsideJobResultsList(element)) return
  if (!targets.includes(element)) targets.push(element)
}

function findSelectableJobCardTargets(card: Element) {
  const targets: HTMLElement[] = []
  const component = card.matches("[componentkey^='job-card-component'], [componentkey*='job-card-component']")
    ? card
    : card.querySelector("[componentkey^='job-card-component'], [componentkey*='job-card-component']")
  addSelectableJobCardTarget(targets, component?.closest("[role='button'][tabindex], [role='button'], button"))
  addSelectableJobCardTarget(targets, component)

  const anchor = findJobAnchor(card)
  const selectors = [
    "[componentkey^='job-card-component']",
    "[componentkey*='job-card-component']",
    "li.jobs-search-results__list-item",
    "li.scaffold-layout__list-item",
    "li[data-occludable-job-id]",
    "div.job-card-container",
    "div[data-job-id]"
  ]
  for (const selector of selectors) {
    addSelectableJobCardTarget(targets, anchor?.closest(selector))
    addSelectableJobCardTarget(targets, card.closest(selector))
  }
  addSelectableJobCardTarget(targets, card)
  return targets
}

async function clickLinkedInJobCardTarget(target: HTMLElement) {
  target.scrollIntoView({ block: "center", behavior: "auto" })
  await delay(150)
  target.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true, view: window }))
  target.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, cancelable: true, view: window }))
  target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }))
  target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }))
  target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }))
  await delay(250)
}

function isLinkedInFullJobView() {
  return /\/jobs\/view\//i.test(window.location.pathname)
}

function isLinkedInJobsSearchSurface() {
  return /^\/jobs\/search\/?$/i.test(window.location.pathname)
}

async function restoreLinkedInJobsSearchUrl(beforeUrl: string) {
  if (window.location.href === beforeUrl) return
  window.location.assign(beforeUrl)
  await delay(1200)
}
function findJobAnchor(card: Element) {
  return Array.from(card.querySelectorAll<HTMLAnchorElement>("a[href*='/jobs/view/'], a[href*='currentJobId=']"))[0] || null
}

function findJobDetailPane(options: { fallbackToBody?: boolean } = {}) {
  const selectors = [
    ".jobs-search__job-details--container",
    ".jobs-search__right-rail",
    ".jobs-details",
    ".jobs-details__main-content",
    ".scaffold-layout__detail",
    "[data-testid=\"job-details\"]",
    "[componentkey*=\"job-details\"]"
  ]
  const pane = selectors.map((selector) => document.querySelector(selector)).find(Boolean)
  return pane || (options.fallbackToBody ? document.body : null)
}

async function waitForJobDetailSelection(title: string | null, linkedinJobUrl: string | null) {
  const startedAt = Date.now()
  const normalizedTitle = cleanText(title || "").toLowerCase()
  const jobIdMatch = linkedinJobUrl?.match(/currentJobId=(\d+)|\/jobs\/view\/(\d+)/)
  const jobId = jobIdMatch?.[1] || jobIdMatch?.[2] || ""

  while (Date.now() - startedAt < 5000) {
    const detailPane = findJobDetailPane()
    const paneText = cleanText(detailPane?.textContent || "").toLowerCase()
    const href = window.location.href
    const titleMatches = Boolean(detailPane) && normalizedTitle.length > 0 && paneText.includes(normalizedTitle)
    const urlMatches = jobId.length > 0 && href.includes(jobId)
    if (titleMatches || urlMatches) {
      return true
    }
    await delay(250)
  }

  return false
}
function findLinkedInJobUrl(card: Element) {
  const anchor = findJobAnchor(card)
  if (!anchor?.href) return null
  try {
    const parsed = new URL(anchor.href)
    parsed.hash = ""
    return parsed.toString()
  } catch {
    return anchor.href
  }
}

function getLinkedInJobCardKey(card: Element, pageNumber: number, indexOnPage: number) {
  const component = card.matches("[componentkey^='job-card-component'], [componentkey*='job-card-component']")
    ? card
    : card.querySelector("[componentkey^='job-card-component'], [componentkey*='job-card-component']")
  const componentKey = component?.getAttribute("componentkey")
  if (componentKey) return `component:${componentKey}`

  const title = findJobTitle(card) || ""
  const company = findJobCompany(card) || ""
  const location = findJobLocation(card) || ""
  const text = cleanText(`${title}|${company}|${location}`)
  if (text.length > 5) return `text:${text.toLowerCase()}`

  return `position:${pageNumber}:${indexOnPage}:${cleanText(card.textContent || "").slice(0, 80).toLowerCase()}`
}
function isLinkedInInternalHref(href: string) {
  try {
    const parsed = new URL(href)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "")
    if (host !== "linkedin.com") return false
    return !parsed.pathname.includes("/safety/") && !parsed.pathname.includes("/redir/")
  } catch {
    return true
  }
}

type ApplyHrefCandidate = {
  href: string | null
  label: string
  diagnostic: Record<string, unknown>
}

const applyResolutionCache = new Map<string, Promise<string | null> | string | null>()

function buildApplyResolutionCacheKey(candidate: ApplyHrefCandidate) {
  const currentJobId = typeof candidate.diagnostic.currentJobId === "string" ? candidate.diagnostic.currentJobId : getCurrentLinkedInJobId() || "unknown-job"
  const pageUrl = typeof candidate.diagnostic.pageUrl === "string" ? candidate.diagnostic.pageUrl : window.location.href
  return `${currentJobId}:${pageUrl}:${candidate.href || "hrefless"}:${candidate.label}`
}

function getCurrentLinkedInJobId() {
  const href = window.location.href
  const match = href.match(/currentJobId=(\d+)|\/jobs\/view\/(\d+)/)
  if (match?.[1] || match?.[2]) return match[1] || match[2]
  const detail = findJobDetailPane({ fallbackToBody: true })
  const idElement = detail?.querySelector<HTMLElement>("[data-job-id], [data-occludable-job-id]")
  return idElement?.dataset.jobId || idElement?.dataset.occludableJobId || null
}

function buildApplyCandidateDiagnostic(element: HTMLElement, label: string, href: string | null) {
  const currentJobId = getCurrentLinkedInJobId()
  const parentChain: Array<Record<string, unknown>> = []
  let node: HTMLElement | null = element
  for (let depth = 0; node && depth < 8; depth += 1, node = node.parentElement) {
    parentChain.push({
      tag: node.tagName,
      id: node.id || null,
      className: typeof node.className === "string" ? node.className : String(node.className || ""),
      role: node.getAttribute("role"),
      href: node instanceof HTMLAnchorElement ? node.href || node.getAttribute("href") : node.getAttribute("href"),
      action: node.getAttribute("action"),
      aria: node.getAttribute("aria-label"),
      data: { ...node.dataset },
      text: cleanText(node.textContent || "").slice(0, 500),
      html: node.outerHTML.slice(0, 1200)
    })
  }

  const allResourceUrls = performance
    .getEntriesByType("resource")
    .map((entry) => entry.name)
  const resourceUrls = allResourceUrls
    .filter((url) => {
      const lower = url.toLowerCase()
      if (!currentJobId) return false
      return (
        lower.includes(`currentjobid=${currentJobId}`) ||
        lower.includes(`/jobs/view/${currentJobId}`) ||
        lower.includes(`jobposting%3a${currentJobId}`) ||
        lower.includes(`jobposting:${currentJobId}`)
      )
    })
    .slice(-12)

  const jsonSignals = Array.from(document.querySelectorAll("code, script[type='application/json'], script[type='application/ld+json']"))
    .map((script) => cleanText(script.textContent || ""))
    .filter((value) => value && (!currentJobId || value.includes(currentJobId)) && /apply|candidat|job|url/i.test(value))
    .slice(0, 5)
    .map((value) => value.slice(0, 1500))

  return {
    pageUrl: window.location.href,
    currentJobId,
    label,
    href,
    tag: element.tagName,
    className: typeof element.className === "string" ? element.className : String(element.className || ""),
    role: element.getAttribute("role"),
    aria: element.getAttribute("aria-label"),
    data: { ...element.dataset },
    html: element.outerHTML.slice(0, 2000),
    parents: parentChain,
    resourceUrls,
    resourceUrlNote: resourceUrls.length > 0 ? "Only URLs scoped to the current LinkedIn job id are included." : "No resource URL was scoped to the current LinkedIn job id.",
    jsonSignals
  }
}

function scoreApplyHrefCandidate(element: HTMLElement, label: string, href: string | null, rootIndex: number) {
  if (label.includes("candidatura simplificada") || label.includes("easy apply")) return -1
  if (element.closest("footer, nav, header, aside")) return -1

  const hasCompanySiteText =
    label.includes("candidatar-se no site da empresa") ||
    label.includes("acessar site da empresa") ||
    label.includes("company site") ||
    label.includes("company website")
  const hasApplyText =
    label.includes("candidatar-se") ||
    label.includes("candidate-se") ||
    label.includes("apply") ||
    label.includes("inscrever")
  if (!hasCompanySiteText && !hasApplyText) return -1

  let score = 0
  const rect = element.getBoundingClientRect()
  if (isVisibleElement(element)) score += 60
  if (hasCompanySiteText) score += 45
  if (hasApplyText) score += 25
  if (href && canonicalizeExternalApplicationUrl(href)) score += 70
  if (href && isLinkedInInternalHref(href)) score -= 20
  if (!href) score += 10
  if (rootIndex === 0) score += 40
  if (rect.top >= 0 && rect.top < window.innerHeight * 0.8) score += 15

  return score
}

function findApplyHrefCandidate(): ApplyHrefCandidate | null {
  const roots = [findJobDetailPane(), document.body].filter(Boolean) as Element[]
  const seen = new Set<string>()
  let bestCandidate: (ApplyHrefCandidate & { score: number }) | null = null

  roots.forEach((root, rootIndex) => {
    const elements = Array.from(root.querySelectorAll<HTMLElement>("a[href], button, [role='button']"))
    const candidates = elements.map((element) => {
      const label = cleanText(`${element.textContent || ""} ${element.getAttribute("aria-label") || ""} ${element.getAttribute("title") || ""}`).toLowerCase()
      const href = element instanceof HTMLAnchorElement ? element.href || element.getAttribute("href") || null : null
      return { element, label, href, diagnostic: buildApplyCandidateDiagnostic(element, label, href) }
    })

    for (const candidate of candidates) {
      const { element, label, href } = candidate
      const dedupeKey = href || `${element.tagName}:${label}`
      if (!dedupeKey || seen.has(dedupeKey)) continue
      seen.add(dedupeKey)

      const score = scoreApplyHrefCandidate(element, label, href, rootIndex)
      if (score < 0) continue
      if (!bestCandidate || score > bestCandidate.score) {
        bestCandidate = {
          href,
          label,
          score,
          diagnostic: {
            ...candidate.diagnostic,
            rootIndex,
            score
          }
        }
      }
    }
  })

  if (bestCandidate) {
    console.info("[Opportunity Desk] selected LinkedIn apply CTA candidate", {
      label: bestCandidate.label,
      href: bestCandidate.href,
      score: bestCandidate.score,
      diagnostic: bestCandidate.diagnostic
    })
    return { href: bestCandidate.href, label: bestCandidate.label, diagnostic: bestCandidate.diagnostic }
  }

  return null
}

async function resolveLinkedInApplyHref(candidate: ApplyHrefCandidate | null) {
  if (!candidate) return null
  if (candidate.href && canonicalizeExternalApplicationUrl(candidate.href)) {
    return candidate.href
  }

  const cacheKey = buildApplyResolutionCacheKey(candidate)
  if (applyResolutionCache.has(cacheKey)) {
    const cached = applyResolutionCache.get(cacheKey)
    return typeof cached === "object" && cached && "then" in cached ? await cached : cached ?? null
  }

  const resolveOnce = (async () => {
    if (!candidate.href) {
      console.info("[Opportunity Desk] LinkedIn apply CTA has no href; resolving from current tab once", candidate.diagnostic)
    }

    try {
      const pageUrl = typeof candidate.diagnostic.pageUrl === "string" ? candidate.diagnostic.pageUrl : window.location.href
      const useCurrentTab = !candidate.href || isLinkedInInternalHref(candidate.href)
      const response = await chrome.runtime.sendMessage({
        type: "RESOLVE_LINKEDIN_APPLY_BUTTON_URL",
        payload: { pageUrl, expectedHref: candidate.href, expectedLabel: candidate.label, useCurrentTab }
      })
      const resolvedUrl = typeof response?.url === "string" ? response.url : null
      if (resolvedUrl && canonicalizeExternalApplicationUrl(resolvedUrl)) return resolvedUrl
      console.info("[Opportunity Desk] LinkedIn apply resolver did not resolve external URL", { response, candidate })
      return candidate.href
    } catch (error) {
      console.info("[Opportunity Desk] LinkedIn apply button click resolution failed", { error, candidate })
      return candidate.href
    }
  })()

  applyResolutionCache.set(cacheKey, resolveOnce)
  const result = await resolveOnce
  applyResolutionCache.set(cacheKey, result)
  return result
}
function hasEasyApplySignal() {
  const pane = findJobDetailPane()
  if (!pane) return false
  const controls = Array.from(pane.querySelectorAll<HTMLElement>("button, a[href], [role='button']"))
  return controls.some((control) => {
    const label = cleanText(`${control.textContent || ""} ${control.getAttribute("aria-label") || ""} ${control.getAttribute("title") || ""}`).toLowerCase()
    return label.includes("easy apply") || label.includes("candidatura simplificada") || label.includes("candidatar-se facilmente")
  })
}

async function waitForJobApplyState() {
  const startedAt = Date.now()
  while (Date.now() - startedAt < JOBS_APPLY_STATE_TIMEOUT_MS) {
    const rawApplyHref = await resolveLinkedInApplyHref(findApplyHrefCandidate())
    if (rawApplyHref) return { rawApplyHref, easyApply: false }
    if (hasEasyApplySignal()) return { rawApplyHref: null, easyApply: true }
    await delay(JOBS_APPLY_STATE_POLL_MS)
  }
  return { rawApplyHref: await resolveLinkedInApplyHref(findApplyHrefCandidate()), easyApply: hasEasyApplySignal() }
}

async function waitForJobsCards() {
  const startedAt = Date.now()
  while (Date.now() - startedAt < JOBS_INITIAL_TIMEOUT_MS) {
    const cards = findJobsCards()
    if (cards.length > 0) return cards
    if (/checkpoint|login|uas\/login|authwall/i.test(window.location.href)) return []
    await delay(500)
  }
  return findJobsCards()
}

async function inspectJobCard(card: Element, pageNumber: number, positionOnPage: number, payload: ContentLinkedInJobsCaptureMessage["payload"]): Promise<LinkedInJobsInspectedCandidate> {
  const title = findJobTitle(card)
  const company = findJobCompany(card)
  const location = findJobLocation(card)
  const linkedinJobUrl = findLinkedInJobUrl(card)
  try {
    const beforeUrl = window.location.href
    const clickTargets = findSelectableJobCardTargets(card)
    if (clickTargets.length === 0) {
      return {
        linkedinJobUrl,
        jobTitle: title,
        companyName: company,
        locationText: location,
        applyButtonKind: "unknown",
        rawApplyHref: null,
        decodedApplyUrl: null,
        canonicalApplyUrl: null,
        sourceKey: null,
        outcome: "inspection_failed",
        skipReason: "LinkedIn result had no safe click target inside the left jobs list.",
        pageNumber,
        positionOnPage
      }
    }

    let selected = false
    for (const clickTarget of clickTargets) {
      await clickLinkedInJobCardTarget(clickTarget)
      if (isLinkedInFullJobView()) {
        window.history.back()
        await delay(1200)
        return {
          linkedinJobUrl,
          jobTitle: title,
          companyName: company,
          locationText: location,
          applyButtonKind: "unknown",
          rawApplyHref: null,
          decodedApplyUrl: null,
          canonicalApplyUrl: null,
          sourceKey: null,
          outcome: "inspection_failed",
          skipReason: `LinkedIn navigated away from the results list after clicking this card: ${beforeUrl}`,
          pageNumber,
          positionOnPage
        }
      }
      if (!isLinkedInJobsSearchSurface()) {
        const afterUrl = window.location.href
        await restoreLinkedInJobsSearchUrl(beforeUrl)
        return {
          linkedinJobUrl,
          jobTitle: title,
          companyName: company,
          locationText: location,
          applyButtonKind: "unknown",
          rawApplyHref: null,
          decodedApplyUrl: null,
          canonicalApplyUrl: null,
          sourceKey: null,
          outcome: "inspection_failed",
          skipReason: `LinkedIn navigated outside the jobs search surface after clicking this result: ${afterUrl}`,
          pageNumber,
          positionOnPage
        }
      }
      selected = await waitForJobDetailSelection(title, linkedinJobUrl)
      if (selected) break
    }

    if (!selected) {
      return {
        linkedinJobUrl,
        jobTitle: title,
        companyName: company,
        locationText: location,
        applyButtonKind: "unknown",
        rawApplyHref: null,
        decodedApplyUrl: null,
        canonicalApplyUrl: null,
        sourceKey: null,
        outcome: "inspection_failed",
        skipReason: "LinkedIn did not update the job detail pane after clicking this result.",
        pageNumber,
        positionOnPage
      }
    }
    const applyState = await waitForJobApplyState()
    const rawApplyHref = applyState.rawApplyHref
    if (!rawApplyHref && applyState.easyApply) {
      return {
        linkedinJobUrl,
        jobTitle: title,
        companyName: company,
        locationText: location,
        applyButtonKind: "easy_apply",
        rawApplyHref: null,
        decodedApplyUrl: null,
        canonicalApplyUrl: null,
        sourceKey: null,
        outcome: "skipped_easy_apply",
        skipReason: "LinkedIn Easy Apply job skipped after no external apply link was found.",
        pageNumber,
        positionOnPage
      }
    }
    if (!rawApplyHref) {
      return {
        linkedinJobUrl,
        jobTitle: title,
        companyName: company,
        locationText: location,
        applyButtonKind: "missing",
        rawApplyHref: null,
        decodedApplyUrl: null,
        canonicalApplyUrl: null,
        sourceKey: null,
        outcome: "missing_external_apply",
        skipReason: "No external apply link found in LinkedIn job detail.",
        pageNumber,
        positionOnPage
      }
    }
    const decodedApplyUrl = decodeLinkedInSafetyRedirect(rawApplyHref)
    const canonicalApplyUrl = canonicalizeExternalApplicationUrl(rawApplyHref)
    if (!decodedApplyUrl || !canonicalApplyUrl) {
      return {
        linkedinJobUrl,
        jobTitle: title,
        companyName: company,
        locationText: location,
        applyButtonKind: "external",
        rawApplyHref,
        decodedApplyUrl,
        canonicalApplyUrl,
        sourceKey: null,
        outcome: "failed_decode",
        skipReason: "External apply link could not be decoded safely.",
        pageNumber,
        positionOnPage
      }
    }
    const sourceMatch = diagnoseCuratedExternalSourceMatch(canonicalApplyUrl, payload.sources, payload.selectedSourceKeys)
    const source = sourceMatch.source
    console.info("[Opportunity Desk] LinkedIn external source match", {
      url: canonicalApplyUrl,
      selectedSourceKeys: sourceMatch.selectedSourceKeys,
      matchedSourceKey: source?.key || null,
      reason: sourceMatch.reason,
      checkedSources: sourceMatch.checkedSources
        .filter((checked) => sourceMatch.selectedSourceKeys.includes(checked.key.toLowerCase()) || checked.matchedSignals.length > 0)
        .map((checked) => ({
          key: checked.key,
          active: checked.active,
          signals: checked.signals,
          matchedSignals: checked.matchedSignals
        }))
    })
    return {
      linkedinJobUrl,
      jobTitle: title,
      companyName: company,
      locationText: location,
      applyButtonKind: "external",
      rawApplyHref,
      decodedApplyUrl,
      canonicalApplyUrl,
      sourceKey: source?.key || null,
      outcome: source ? "accepted" : "unsupported_source",
      skipReason: source ? null : `External apply source did not match selected source signals (${sourceMatch.reason}).`,
      pageNumber,
      positionOnPage
    }
  } catch (error) {
    return {
      linkedinJobUrl,
      jobTitle: title,
      companyName: company,
      locationText: location,
      applyButtonKind: "unknown",
      rawApplyHref: null,
      decodedApplyUrl: null,
      canonicalApplyUrl: null,
      sourceKey: null,
      outcome: "inspection_failed",
      skipReason: error instanceof Error ? error.message.slice(0, 300) : "DOM inspection failed.",
      pageNumber,
      positionOnPage
    }
  }
}

function findNextJobsPageButton() {
  const explicitNext = document.querySelector<HTMLButtonElement>("button[data-testid='pagination-controls-next-button-visible']")
  if (explicitNext && !explicitNext.disabled && explicitNext.getAttribute("aria-disabled") !== "true") {
    return explicitNext
  }

  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>("button, a[role='button'], a[href*='start=']"))
  return buttons.find((button) => {
    const label = cleanText(`${button.textContent || ""} ${button.getAttribute("aria-label") || ""}`).toLowerCase()
    const disabled = button instanceof HTMLButtonElement ? button.disabled : button.getAttribute("aria-disabled") === "true"
    return !disabled && NEXT_PAGE_LABELS.some((text) => label.includes(text))
  }) || null
}

function countersFromCandidates(candidates: LinkedInJobsInspectedCandidate[], pagesVisited: number): LinkedInJobsCounters {
  return {
    pagesVisited,
    jobsInspected: candidates.length,
    externalLinksFound: candidates.filter((candidate) => candidate.rawApplyHref).length,
    accepted: candidates.filter((candidate) => candidate.outcome === "accepted").length,
    skippedEasyApply: candidates.filter((candidate) => candidate.outcome === "skipped_easy_apply").length,
    unsupportedSource: candidates.filter((candidate) => candidate.outcome === "unsupported_source").length,
    duplicates: candidates.filter((candidate) => candidate.outcome === "duplicate").length,
    failures: candidates.filter((candidate) => candidate.outcome === "failed_decode" || candidate.outcome === "inspection_failed").length
  }
}
function buildLinkedInJobsDiagnosticSamples(candidates: LinkedInJobsInspectedCandidate[]) {
  const prioritized = candidates.filter((candidate) => candidate.rawApplyHref || candidate.outcome !== "skipped_easy_apply")
  const source = prioritized.length > 0 ? prioritized : candidates
  return source.slice(-10).map((candidate) => ({
    title: candidate.jobTitle,
    company: candidate.companyName,
    outcome: candidate.outcome,
    applyUrl: candidate.canonicalApplyUrl,
    rawApplyHref: candidate.rawApplyHref,
    sourceKey: candidate.sourceKey,
    skipReason: candidate.skipReason
  }))
}

async function captureLinkedInJobs(payload: ContentLinkedInJobsCaptureMessage["payload"]): Promise<ContentLinkedInJobsCaptureResponse> {
  const candidates: LinkedInJobsInspectedCandidate[] = []
  const startedAt = new Date().toISOString()
  let terminalReason: LinkedInJobsDiagnostics["terminalReason"] = "max_pages_reached"
  let safeMessage = "Reached the configured LinkedIn Jobs page limit."
  const navigationMethod: LinkedInJobsDiagnostics["navigationMethod"] = payload.assistedSearchEnabled ? "jobs_click_path" : "direct_url"

  if (payload.assistedSearchEnabled) {
    emitLinkedInJobsContentProgress({ startedAt, pageUrl: window.location.href, navigationMethod, safeMessage: "Looking for LinkedIn assisted jobs entry." })
    const assistedNavigation = await navigateViaAssistedJobsEntry()
    if (!assistedNavigation.ok) {
      const diagnostics: LinkedInJobsDiagnostics = {
        startedAt,
        pageUrl: window.location.href,
        navigationMethod,
        terminalReason: assistedNavigation.clicked ? "assisted_navigation_failed" : "assisted_entry_unavailable",
        safeMessage: assistedNavigation.message,
        pagesVisited: 0,
        jobsInspected: 0,
        externalLinksFound: 0,
        accepted: 0,
        skippedEasyApply: 0,
        unsupportedSource: 0,
        duplicates: 0,
        failures: 1,
        samples: []
      }
      return { candidates, diagnostics }
    }
    emitLinkedInJobsContentProgress({ startedAt, pageUrl: window.location.href, navigationMethod, safeMessage: assistedNavigation.message })
    await delay(JOBS_PAGE_DELAY_MS)
  }
  const seenLinkedInJobUrls = new Set<string>()

  for (let page = 1; page <= payload.maxPages; page += 1) {
    let cards = await waitForJobsCards()
    if (cards.length === 0) {
      terminalReason = /checkpoint|login|uas\/login|authwall/i.test(window.location.href) ? "linkedin_login_required" : "no_renderable_results"
      safeMessage = terminalReason === "linkedin_login_required" ? "LinkedIn login is required in this Chrome profile." : "LinkedIn Jobs did not render inspectable job cards."
      break
    }

    let noProgressScrolls = 0
    for (let scroll = 0; scroll < JOBS_MAX_SCROLLS_PER_PAGE && noProgressScrolls < JOBS_MAX_NO_PROGRESS_SCROLLS; scroll += 1) {
      cards = findJobsCards()
      let inspectedThisScroll = 0

      for (let index = 0; index < cards.length; index += 1) {
        const linkedinJobUrl = findLinkedInJobUrl(cards[index])
        const seenKey = linkedinJobUrl || getLinkedInJobCardKey(cards[index], page, index + 1)
        if (seenLinkedInJobUrls.has(seenKey)) {
          continue
        }

        seenLinkedInJobUrls.add(seenKey)
        inspectedThisScroll += 1
        const inspectedCandidate = await inspectJobCard(cards[index], page, candidates.length + 1, payload)
        candidates.push(inspectedCandidate)
        console.info("[Opportunity Desk] inspected LinkedIn job", {
          title: inspectedCandidate.jobTitle,
          company: inspectedCandidate.companyName,
          outcome: inspectedCandidate.outcome,
          rawApplyHref: inspectedCandidate.rawApplyHref,
          canonicalApplyUrl: inspectedCandidate.canonicalApplyUrl,
          sourceKey: inspectedCandidate.sourceKey,
          skipReason: inspectedCandidate.skipReason
        })
        const partialCounters = countersFromCandidates(candidates, page)
        emitLinkedInJobsContentProgress({
          startedAt,
          pageUrl: window.location.href,
          navigationMethod,
          safeMessage: `Inspecting LinkedIn Jobs cards: page ${page}, ${partialCounters.jobsInspected} inspected.`,
          ...partialCounters,
          samples: buildLinkedInJobsDiagnosticSamples(candidates)
        })
        await delay(JOBS_CARD_INSPECTION_DELAY_MS)
      }

      noProgressScrolls = inspectedThisScroll > 0 ? 0 : noProgressScrolls + 1
      if (scroll >= JOBS_MAX_SCROLLS_PER_PAGE - 1 || noProgressScrolls >= JOBS_MAX_NO_PROGRESS_SCROLLS) {
        break
      }

      const scrollResult = scrollJobsResultsList(cards)
      emitLinkedInJobsContentProgress({
        startedAt,
        pageUrl: window.location.href,
        navigationMethod,
        safeMessage: `Scrolling LinkedIn Jobs results: page ${page}, ${candidates.length} inspected.`,
        ...countersFromCandidates(candidates, page)
      })
      console.info("[Opportunity Desk] scrolled LinkedIn Jobs result list", { page, scroll: scroll + 1, ...scrollResult })
      await delay(JOBS_PAGE_DELAY_MS)
    }

    if (page >= payload.maxPages) break
    const nextButton = findNextJobsPageButton()
    if (!nextButton) {
      terminalReason = "no_next_page"
      safeMessage = "LinkedIn Jobs result list reached the end of visible results."
      break
    }
    nextButton.scrollIntoView({ block: "center", behavior: "auto" })
    await delay(300)
    nextButton.click()
    await delay(JOBS_PAGE_DELAY_MS)
  }
  const counters = countersFromCandidates(candidates, Math.max(1, Math.min(payload.maxPages, new Set(candidates.map((candidate) => candidate.pageNumber)).size || 1)))
  const diagnostics: LinkedInJobsDiagnostics = {
    startedAt,
    pageUrl: window.location.href,
    navigationMethod,
    terminalReason,
    safeMessage,
    ...counters,
    samples: buildLinkedInJobsDiagnosticSamples(candidates)
  }
  emitLinkedInJobsContentProgress({
    ...diagnostics,
    status: "submitting",
    safeMessage: `Submitting ${diagnostics.accepted} accepted LinkedIn Jobs candidates.`
  })
  return { candidates, diagnostics }
}

chrome.runtime.onMessage.addListener((message: ContentLinkedInJobsCaptureMessage, _sender, sendResponse) => {
  if (message.type !== "CAPTURE_LINKEDIN_JOBS_EXTERNAL") {
    return false
  }
  captureLinkedInJobs(message.payload)
    .then(sendResponse)
    .catch((error: Error) => {
      const diagnostics: LinkedInJobsDiagnostics = {
        startedAt: new Date().toISOString(),
        pageUrl: window.location.href,
        navigationMethod: message.payload.assistedSearchEnabled ? "jobs_click_path" : "direct_url",
        terminalReason: "dom_inspection_failed",
        safeMessage: error.message || "LinkedIn Jobs DOM inspection failed.",
        pagesVisited: 0,
        jobsInspected: 0,
        externalLinksFound: 0,
        accepted: 0,
        skippedEasyApply: 0,
        unsupportedSource: 0,
        duplicates: 0,
        failures: 1,
        samples: []
      }
      sendResponse({ candidates: [], diagnostics })
    })
  return true
})
