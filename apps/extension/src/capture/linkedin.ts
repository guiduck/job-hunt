import type { LinkedInCapturedPost } from "./types"

const DEFAULT_INTENT_TERMS = new Set(["hiring", "contratando", "contratamos", "vaga", "vagas", "job", "jobs"])
export const MAX_SAVED_SEARCH_KEYWORDS = 30

export type LinkedInContentSearchUrlOptions = {
  keywords: string
  sortMode?: "recent" | "relevant"
  pastMonthOnly?: boolean
}

export function buildLinkedInContentSearchUrl({
  keywords,
  sortMode,
  pastMonthOnly
}: LinkedInContentSearchUrlOptions) {
  const effectiveKeywords = keywords.trim()
  const params = new URLSearchParams({
    keywords: effectiveKeywords,
    origin: "FACETED_SEARCH",
    sid: "VRT"
  })
  if (sortMode !== "relevant") {
    params.set("sortBy", '"date_posted"')
  }
  if (pastMonthOnly) {
    params.set("datePosted", '"past-month"')
  }

  return `https://www.linkedin.com/search/results/content/?${params.toString()}`
}

export function filterCapturedPosts(
  posts: LinkedInCapturedPost[],
  filters: {
    excludedRegions?: string
    remoteOnly?: boolean
    excludeOnsite?: boolean
  }
) {
  const excludedTerms = unique([
    ...splitTerms(filters.excludedRegions || ""),
    ...(filters.excludeOnsite ? ["onsite", "on-site", "presencial", "hibrido", "híbrido", "hybrid"] : [])
  ]).map((term) => term.toLowerCase())

  return posts.filter((post) => {
    const text = post.providedText.toLowerCase()
    if (excludedTerms.some((term) => text.includes(term))) {
      return false
    }
    return true
  })
}

export function normalizeKeywords(input: string) {
  const keywords = normalizeSearchKeywords(input)
  return keywords.length > 0 ? keywords : [input.trim()].filter(Boolean)
}

export function normalizeSearchKeywords(input: string) {
  const keywords: string[] = []
  const seen = new Set<string>()

  for (const token of input.replace(/[,\n/]/g, " ").split(/\s+/)) {
    const normalized = token.trim().toLowerCase()
    if (!normalized || DEFAULT_INTENT_TERMS.has(normalized) || seen.has(normalized)) {
      continue
    }
    seen.add(normalized)
    keywords.push(normalized)
  }

  return keywords
}

export function mergeSavedSearchKeywords(existing: string[], input: string, limit = MAX_SAVED_SEARCH_KEYWORDS) {
  const merged: string[] = []
  const seen = new Set<string>()
  for (const keyword of [...existing, ...normalizeSearchKeywords(input)]) {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized || DEFAULT_INTENT_TERMS.has(normalized) || seen.has(normalized)) {
      continue
    }
    seen.add(normalized)
    merged.push(normalized)
    if (merged.length >= limit) {
      break
    }
  }
  return merged
}

export function appendKeywordToSearchText(searchText: string, keyword: string) {
  const normalizedKeyword = normalizeSearchKeywords(keyword)[0]
  if (!normalizedKeyword) {
    return searchText
  }
  const currentKeywords = new Set(normalizeSearchKeywords(searchText))
  if (currentKeywords.has(normalizedKeyword)) {
    return searchText.trim()
  }
  const currentSearchText = searchText.trim()
  return currentSearchText ? `${currentSearchText} ${normalizedKeyword}` : normalizedKeyword
}

function splitTerms(input: string) {
  return input
    .split(/[,\n]/)
    .map((term) => term.trim())
    .filter(Boolean)
}

function unique(values: string[]) {
  const seen = new Set<string>()
  const output: string[] = []
  for (const value of values) {
    const normalized = value.trim()
    const key = normalized.toLowerCase()
    if (!normalized || seen.has(key)) {
      continue
    }
    seen.add(key)
    output.push(normalized)
  }
  return output
}

export function toCollectionInputs(posts: LinkedInCapturedPost[]) {
  return posts.map((post) => ({
    source_type: "authenticated_browser_search" as const,
    source_url: post.sourceUrl,
    provided_text: cleanCapturedText(post.providedText),
    label: post.label
  }))
}

function cleanCapturedText(text: string) {
  return text
    .replace(/#[\p{L}\p{N}_-]+/gu, " ")
    .replace(/\bhashtag\b\s*[:;,.]*/giu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export type LinkedInJobsSearchUrlOptions = {
  searchText?: string
  queryTerms?: string[]
  mode?: "default_browse" | "classic_keywords" | "assisted"
  datePosted?: "any_time" | "past_month" | "past_week" | "past_24_hours"
  sort?: "relevant" | "most_recent"
}

const LINKEDIN_JOBS_DATE_PARAM: Record<NonNullable<LinkedInJobsSearchUrlOptions["datePosted"]>, string | null> = {
  any_time: null,
  past_month: "r2592000",
  past_week: "r604800",
  past_24_hours: "r86400"
}

export function parseLinkedInJobsQueryTerms(input: string) {
  return unique(
    input
      .replace(/[,\n/]/g, " ")
      .split(/\s+/)
      .map((term) => term.trim())
      .filter(Boolean)
  )
}

export function buildLinkedInJobsSearchUrl(options: LinkedInJobsSearchUrlOptions = {}) {
  const params = new URLSearchParams({ origin: "JOB_SEARCH_PAGE_JOB_FILTER" })
  const terms = options.queryTerms?.length ? options.queryTerms : parseLinkedInJobsQueryTerms(options.searchText || "")
  if (terms.length > 0) {
    params.set("keywords", terms.join(" OR "))
  }
  const dateParam = LINKEDIN_JOBS_DATE_PARAM[options.datePosted || "any_time"]
  if (dateParam && options.mode !== "assisted") {
    params.set("f_TPR", dateParam)
  }
  if (options.sort === "most_recent" && options.mode !== "assisted") {
    params.set("sortBy", "DD")
  }
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`
}

const TRACKING_QUERY_PREFIXES = ["utm_"]
const TRACKING_QUERY_KEYS = new Set(["trk", "ref", "refid", "src", "source", "li_fat_id", "lipi"])

export function decodeLinkedInSafetyRedirect(url: string) {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "")
    if (host !== "linkedin.com") {
      return url.trim() || null
    }
    if (!parsed.pathname.includes("/safety/") && !parsed.pathname.includes("/redir/")) {
      return url.trim() || null
    }
    const target = parsed.searchParams.get("url") || parsed.searchParams.get("target") || parsed.searchParams.get("u")
    return target?.startsWith("http") ? decodeURIComponent(target) : null
  } catch {
    return null
  }
}

export function canonicalizeExternalApplicationUrl(url: string) {
  const decoded = decodeLinkedInSafetyRedirect(url)
  if (!decoded) return null
  try {
    const parsed = new URL(decoded)
    if (!["http:", "https:"].includes(parsed.protocol)) return null
    for (const key of Array.from(parsed.searchParams.keys())) {
      const lower = key.toLowerCase()
      if (TRACKING_QUERY_KEYS.has(lower) || TRACKING_QUERY_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
        parsed.searchParams.delete(key)
      }
    }
    parsed.hash = ""
    parsed.hostname = parsed.hostname.toLowerCase()
    parsed.pathname = parsed.pathname.replace(/\/$/, "") || "/"
    return parsed.toString()
  } catch {
    return null
  }
}

export type CuratedSourceMatcher = {
  key: string
  domain: string
  active?: boolean
}

export function matchCuratedExternalSource(url: string, sources: CuratedSourceMatcher[], selectedSourceKeys: string[]) {
  const canonical = canonicalizeExternalApplicationUrl(url)
  if (!canonical) return null
  const selected = new Set(selectedSourceKeys)
  const host = new URL(canonical).hostname.toLowerCase().replace(/^www\./, "")
  return sources.find((source) => {
    const domain = source.domain.toLowerCase().replace(/^www\./, "")
    return source.active !== false && selected.has(source.key) && (host === domain || host.endsWith(`.${domain}`))
  }) || null
}
