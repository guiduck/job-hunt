import type { Opportunity } from "../api/types"

const HASHTAG_PATTERN = /#[\p{L}\p{N}_-]+/gu
const LINKEDIN_NOISE_PATTERNS = [
  /\bmais\s+Exibir tradução\b/giu,
  /\bExibir tradução\b/giu,
  /\bGostei\s+Comentar\s+Compartilhar\s+Enviar\b/giu,
  /\bGostei\s+Comentar\s+Compartilhar\b/giu,
  /\bEnviar\b/giu,
  /\b\d+\s+comentários?\b/giu
]

export function opportunityTitle(opportunity: Opportunity) {
  return postPresentation(opportunity).authorName || "LinkedIn author"
}

export function companyName(opportunity: Opportunity) {
  return opportunity.job_detail?.company_name || opportunity.organization_name || null
}

export function emailDomainLabel(opportunity: Opportunity) {
  const email = opportunity.job_detail?.contact_email
  const domain = email?.split("@")[1]?.split(".")[0]
  if (!domain) {
    return null
  }

  return domain
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}

export function scoreTone(score: number | null | undefined) {
  if (score === undefined || score === null) return "neutral"
  if (score >= 75) return "good"
  if (score >= 50) return "warn"
  return "danger"
}

export function postPresentation(opportunity: Opportunity) {
  const rawEvidence = cleanText(opportunity.source_evidence || opportunity.job_detail?.job_description || "")
  const authorName = extractAuthorName(rawEvidence)
  const hashtags = unique(rawEvidence.match(HASHTAG_PATTERN) || [])
  const message = extractMessage(rawEvidence, hashtags)
  const contactValue = opportunity.job_detail?.contact_email || opportunity.job_detail?.contact_channel_value || ""

  return {
    authorName,
    contactLabel: contactValue || "LinkedIn author",
    hashtags,
    message,
    excerpt: truncate(message || rawEvidence, 220),
    contactHref: contactHref(opportunity),
    contactActionLabel: opportunity.job_detail?.contact_email ? "Send email" : "Send message"
  }
}

function extractAuthorName(text: string) {
  const feedMatch = text.match(/^Publica(?:ç|c)[aã]o no feed\s+(.+?)(?:\s+•|\s+\d|$)/iu)
  const rawName = feedMatch?.[1] || ""
  const normalized = dedupeRepeatedName(rawName.replace(/\.$/, "").trim())

  if (normalized && normalized.length <= 80) {
    return normalized
  }

  return ""
}

function extractMessage(text: string, hashtags: string[]) {
  let message = text
    .replace(/^Publica(?:ç|c)[aã]o no feed\s+.+?(?:\bSeguir\b|\bFollow\b)/iu, "")
    .replace(/\bMatched\s+\d+\s+keyword\(s\):.*$/iu, "")

  for (const pattern of LINKEDIN_NOISE_PATTERNS) {
    message = message.replace(pattern, " ")
  }

  for (const hashtag of hashtags) {
    message = message.replaceAll(hashtag, " ")
  }

  return cleanText(message)
}

function contactHref(opportunity: Opportunity) {
  const email = opportunity.job_detail?.contact_email
  if (email) {
    return `mailto:${email}`
  }

  return opportunity.job_detail?.poster_profile_url || opportunity.source_url || null
}

function dedupeRepeatedName(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length % 2 !== 0) {
    return name
  }

  const midpoint = parts.length / 2
  const firstHalf = parts.slice(0, midpoint).join(" ")
  const secondHalf = parts.slice(midpoint).join(" ")
  return firstHalf === secondHalf ? firstHalf : name
}

function cleanText(text: string) {
  return text
    .replace(HASHTAG_PATTERN, " ")
    .replace(/\bhashtag\b\s*[:;,.]*/giu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength).trim()}...`
}

function unique(values: string[]) {
  return Array.from(new Set(values))
}
