import type { LinkedInCapturedPost } from "./types"

const DEFAULT_INTENT_TERMS = new Set(["hiring", "contratando", "contratamos", "vaga", "vagas", "job", "jobs"])

export function buildLinkedInContentSearchUrl({
  keywords,
  region,
  sortMode
}: {
  keywords: string
  region?: string
  sortMode?: "recent" | "relevant"
}) {
  const effectiveKeywords = [keywords.trim(), region?.trim()].filter(Boolean).join(" ")
  const params = new URLSearchParams({
    keywords: effectiveKeywords,
    origin: "FACETED_SEARCH",
    sid: "VRT"
  })
  if (sortMode !== "relevant") {
    params.set("sortBy", '"date_posted"')
  }

  return `https://www.linkedin.com/search/results/content/?${params.toString()}`
}

export function normalizeKeywords(input: string) {
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

  return keywords.length > 0 ? keywords : [input.trim()].filter(Boolean)
}

export function toCollectionInputs(posts: LinkedInCapturedPost[]) {
  return posts.map((post) => ({
    source_type: "authenticated_browser_search" as const,
    source_url: post.sourceUrl,
    provided_text: post.providedText,
    label: post.label
  }))
}
