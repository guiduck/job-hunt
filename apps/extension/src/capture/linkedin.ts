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
