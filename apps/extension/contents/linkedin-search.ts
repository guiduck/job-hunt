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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function findPostUrl(element: Element) {
  const anchors = Array.from(element.querySelectorAll<HTMLAnchorElement>("a[href]"))
  const postLink = anchors.find((anchor) => {
    const href = anchor.href
    return href.includes("/feed/update/") || href.includes("/posts/") || href.includes("/jobs/view/")
  })

  return postLink?.href || window.location.href
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

function extractVisiblePosts(maxPosts: number, diagnostics: CaptureDiagnostics): LinkedInCapturedPost[] {
  const seen = new Set<string>()
  const posts: LinkedInCapturedPost[] = []

  for (const selector of POST_SELECTORS) {
    const elements = Array.from(document.querySelectorAll(selector))
    const selectorScan = {
      selector,
      elements: elements.length,
      postsFoundSoFar: posts.length
    }
    diagnostics.selectorScans.push(selectorScan)
    console.info("[Opportunity Desk] selector scan", selectorScan)

    for (const element of elements) {
      if (posts.length >= maxPosts) {
        return posts
      }

      const providedText = cleanText(element.textContent || "")
      if (providedText.length < 80) {
        diagnostics.skipped.shortText += 1
        continue
      }

      if (seen.has(providedText)) {
        diagnostics.skipped.duplicateText += 1
        continue
      }

      seen.add(providedText)
      const authorName = findAuthorName(element)
      const post = {
        label: authorName || `LinkedIn post ${posts.length + 1}`,
        providedText,
        sourceUrl: findPostUrl(element)
      }
      posts.push(post)
      const sample = {
        label: post.label,
        sourceUrl: post.sourceUrl,
        textLength: providedText.length,
        textPreview: providedText.slice(0, 180)
      }
      if (diagnostics.samples.length < 8) {
        diagnostics.samples.push(sample)
      }
      console.info("[Opportunity Desk] captured post candidate", sample)
    }
  }

  return posts
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
  let posts = extractVisiblePosts(payload.maxPosts, diagnostics)

  for (let index = 0; index < payload.maxScrolls && posts.length < payload.maxPosts; index += 1) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
    await delay(payload.scrollDelayMs)
    posts = extractVisiblePosts(payload.maxPosts, diagnostics)
    const scrollProgress = {
      scroll: index + 1,
      postsFound: posts.length,
      scrollHeight: document.body.scrollHeight
    }
    diagnostics.scrolls.push(scrollProgress)
    console.info("[Opportunity Desk] scroll capture progress", scrollProgress)
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
