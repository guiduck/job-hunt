import type {
  FieldAssistantActivation,
  FieldAssistantScopeType,
  FieldResponseSuggestion
} from "../api/types"

export type FieldDescriptor = {
  fieldLabel: string | null
  fieldName: string | null
  fieldPlaceholder: string | null
  fieldType: string | null
  keyword: string
  questionText: string
  surroundingText: string | null
}

export type EditableField = HTMLInputElement | HTMLTextAreaElement | HTMLElement

export type FieldAssistantPageStatus =
  | { status: "unauthenticated"; message: string }
  | { status: "unsupported"; message: string }
  | { status: "disabled"; message: string; baseDomain: string; exactPage: string }
  | {
      status: "enabled"
      message: string
      baseDomain: string
      exactPage: string
      activation: FieldAssistantActivation
    }

export type FieldAssistantGeneratePayload = FieldDescriptor & {
  scopeUrl: string
}

export type FieldAssistantGenerateResult =
  | {
      ok: true
      generationId: string
      keyword: string
      answerText: string
      rationale: string | null
      missingContext: string[]
      suggestions: FieldResponseSuggestion[]
    }
  | { ok: false; error: string }

export const FIELD_ASSISTANT_MESSAGE_TYPES = {
  enableCurrent: "FIELD_ASSISTANT_ENABLE_CURRENT",
  getPageStatus: "FIELD_ASSISTANT_GET_PAGE_STATUS",
  openShell: "FIELD_ASSISTANT_OPEN_SHELL",
  minimizeShell: "FIELD_ASSISTANT_MINIMIZE_SHELL",
  closeShell: "FIELD_ASSISTANT_CLOSE_SHELL",
  generateForField: "FIELD_ASSISTANT_GENERATE_FOR_FIELD",
  listSuggestions: "FIELD_ASSISTANT_LIST_SUGGESTIONS",
  saveSuggestion: "FIELD_ASSISTANT_SAVE_SUGGESTION",
  markSuggestionUsed: "FIELD_ASSISTANT_MARK_SUGGESTION_USED",
  pageStatusChanged: "FIELD_ASSISTANT_PAGE_STATUS_CHANGED"
} as const

const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term"
])

const SENSITIVE_FIELD_RE = /(password|passcode|secret|token|otp|2fa|cvv|card|credit|ssn|cpf|cnpj)/i
const SEARCH_FIELD_RE = /(^|\b)(search|pesquisa|pesquisar|buscar|busca)(\b|$)/i

export function isSupportedPageUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function normalizeBaseDomain(rawUrl: string) {
  if (!isSupportedPageUrl(rawUrl)) {
    return null
  }
  const hostname = new URL(rawUrl).hostname.toLowerCase()
  return hostname.startsWith("www.") ? hostname.slice(4) : hostname
}

export function normalizeExactPage(rawUrl: string) {
  if (!isSupportedPageUrl(rawUrl)) {
    return null
  }
  const url = new URL(rawUrl)
  url.hash = ""
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key)
    }
  }
  url.hostname = url.hostname.toLowerCase()
  return url.toString().replace(/\/$/, "")
}

export function normalizeActivationScope(scopeType: FieldAssistantScopeType, rawUrl: string) {
  return scopeType === "base_domain" ? normalizeBaseDomain(rawUrl) : normalizeExactPage(rawUrl)
}

export function matchesActivation(rawUrl: string, activation: FieldAssistantActivation) {
  if (!activation.enabled) {
    return false
  }
  const normalized = normalizeActivationScope(activation.scope_type, rawUrl)
  return normalized === activation.scope_value
}

export function findMatchingActivation(rawUrl: string, activations: FieldAssistantActivation[]) {
  return activations.find((activation) => matchesActivation(rawUrl, activation)) || null
}

export function isSensitiveFieldMeta(meta: {
  fieldLabel?: string | null
  fieldName?: string | null
  fieldPlaceholder?: string | null
  fieldType?: string | null
  questionText?: string | null
}) {
  const type = meta.fieldType?.toLowerCase() || ""
  if (type === "password" || type === "hidden") {
    return true
  }
  return [meta.fieldLabel, meta.fieldName, meta.fieldPlaceholder, meta.questionText].some((value) =>
    SENSITIVE_FIELD_RE.test(value || "")
  )
}

export function isSearchFieldMeta(meta: {
  fieldLabel?: string | null
  fieldName?: string | null
  fieldPlaceholder?: string | null
  fieldType?: string | null
  questionText?: string | null
}) {
  const type = meta.fieldType?.toLowerCase() || ""
  if (type === "search") {
    return true
  }
  return [meta.fieldLabel, meta.fieldName, meta.fieldPlaceholder].some((value) => SEARCH_FIELD_RE.test((value || "").trim()))
}

export function isEligibleField(element: Element): element is EditableField {
  if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement) && !(element instanceof HTMLElement && element.isContentEditable)) {
    return false
  }
  if (element.offsetParent === null) {
    return false
  }
  if ((element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) && (element.disabled || element.readOnly)) {
    return false
  }
  if (element instanceof HTMLInputElement) {
    const type = (element.type || "text").toLowerCase()
    if (!["text", "email", "url", "tel", ""].includes(type)) {
      return false
    }
  }
  const descriptor = describeField(element)
  if (isSensitiveFieldMeta(descriptor) || isSearchFieldMeta(descriptor)) {
    return false
  }
  const rect = element.getBoundingClientRect()
  return rect.width >= 120 && rect.height >= 24
}

export function describeField(element: EditableField): FieldDescriptor {
  const label = findLabelText(element)
  const placeholder = element.getAttribute("placeholder")
  const name = element.getAttribute("name") || element.id || element.getAttribute("aria-label")
  const surroundingText = findSurroundingText(element)
  const questionText = [label, placeholder, surroundingText].filter(Boolean).join(" ").trim() || name || "Application question"

  return {
    fieldLabel: label,
    fieldName: name,
    fieldPlaceholder: placeholder,
    fieldType: element instanceof HTMLInputElement ? element.type || "text" : element instanceof HTMLTextAreaElement ? "textarea" : "contenteditable",
    keyword: inferKeyword(questionText),
    questionText,
    surroundingText
  }
}

function findLabelText(element: EditableField) {
  const ariaLabel = element.getAttribute("aria-label")
  if (ariaLabel?.trim()) {
    return ariaLabel.trim()
  }
  const labelledBy = element.getAttribute("aria-labelledby")
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .filter(Boolean)
      .join(" ")
    if (text) {
      return text
    }
  }
  if (element.id) {
    const explicit = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(element.id)}"]`)
    if (explicit?.textContent?.trim()) {
      return explicit.textContent.trim()
    }
  }
  const parentLabel = element.closest("label")
  if (parentLabel?.textContent?.trim()) {
    return parentLabel.textContent.trim()
  }
  return null
}

function findSurroundingText(element: EditableField) {
  const container = element.closest("fieldset, section, article, form, div")
  const text = container?.textContent?.replace(/\s+/g, " ").trim() || ""
  return text ? text.slice(0, 600) : null
}

export function inferKeyword(text: string) {
  const normalized = text.toLowerCase()
  if (/(why|motiva|interesse|interested|want to work|por que|porque)/i.test(normalized)) return "motivation"
  if (/(experience|experiencia|experiência|worked|background|trajetoria)/i.test(normalized)) return "experience"
  if (/(salary|compensation|pretens[aã]o|remunera|rate|pay)/i.test(normalized)) return "salary"
  if (/(available|availability|start|disponibilidade|inicio|início)/i.test(normalized)) return "availability"
  if (/(visa|authorization|work permit|autorizado|direito de trabalhar)/i.test(normalized)) return "work_authorization"
  if (/(english|ingl[eê]s|language|idioma)/i.test(normalized)) return "english_level"
  if (/(stack|technology|tecnologia|typescript|react|python|node|skills|habilidades)/i.test(normalized)) return "stack"
  if (/(summary|bio|about you|sobre voc[eê]|profile|perfil)/i.test(normalized)) return "professional_summary"
  return keywordFromTerms(normalized)
}

function keywordFromTerms(text: string) {
  const stopwords = new Set([
    "about",
    "above",
    "after",
    "answer",
    "application",
    "are",
    "campo",
    "com",
    "como",
    "describe",
    "enter",
    "field",
    "for",
    "from",
    "have",
    "how",
    "input",
    "job",
    "more",
    "para",
    "please",
    "question",
    "response",
    "sobre",
    "that",
    "the",
    "this",
    "uma",
    "voce",
    "vocÃª",
    "what",
    "when",
    "where",
    "which",
    "with",
    "you",
    "your"
  ])
  const terms = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9]{3,}/g)
    ?.filter((term) => !stopwords.has(term))
    .slice(0, 5)
  return terms?.length ? terms.join("_") : "general_fit"
}
