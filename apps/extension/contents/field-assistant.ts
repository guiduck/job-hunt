import type { PlasmoCSConfig } from "plasmo"

import "../src/styles/field-assistant.css"
import {
  describeField,
  FIELD_ASSISTANT_MESSAGE_TYPES,
  inferKeyword,
  isEligibleField,
  type EditableField,
  type FieldAssistantGenerateResult,
  type FieldAssistantPageStatus
} from "../src/utils/fieldAssistant"

export const config: PlasmoCSConfig = {
  matches: ["http://*/*", "https://*/*"],
  all_frames: false
}

const buttons = new WeakMap<EditableField, HTMLButtonElement>()
let observer: MutationObserver | null = null
let enabled = false
let shell: HTMLDivElement | null = null
let activeMenu: HTMLDivElement | null = null
let activeField: EditableField | null = null
let scanTimer: number | null = null
let scanInterval: number | null = null
let lastHref = location.href

function sendMessage<T>(message: Record<string, unknown>): Promise<T> {
  return chrome.runtime.sendMessage(message) as Promise<T>
}

async function refreshStatus() {
  const response = await sendMessage<{ ok: boolean; status?: FieldAssistantPageStatus; error?: string }>({
    type: FIELD_ASSISTANT_MESSAGE_TYPES.getPageStatus,
    payload: { url: location.href }
  }).catch((error: Error) => ({ ok: false, error: error.message }) as { ok: boolean; status?: FieldAssistantPageStatus; error?: string })

  enabled = response.ok && response.status?.status === "enabled"
  if (enabled) {
    install()
    renderShell(response.status)
  } else {
    uninstall()
  }
}

function install() {
  scheduleScan()
  observer ||= new MutationObserver(() => scheduleScan())
  observer.observe(document.documentElement, {
    attributeFilter: ["aria-hidden", "class", "contenteditable", "disabled", "hidden", "readonly", "style"],
    attributes: true,
    childList: true,
    subtree: true
  })
  if (scanInterval === null) {
    scanInterval = window.setInterval(() => {
      if (location.href !== lastHref) {
        lastHref = location.href
        activeMenu?.remove()
        activeMenu = null
        activeField = null
        void refreshStatus()
        return
      }
      scheduleScan()
    }, 1500)
  }
  window.addEventListener("scroll", positionButtons, true)
  window.addEventListener("resize", positionButtons)
  document.addEventListener("focusin", handleFocusIn)
  document.addEventListener("pointerover", handlePointerOver)
  document.addEventListener("visibilitychange", handleVisibilityChange)
}

function uninstall() {
  observer?.disconnect()
  observer = null
  if (scanTimer !== null) {
    window.clearTimeout(scanTimer)
    scanTimer = null
  }
  if (scanInterval !== null) {
    window.clearInterval(scanInterval)
    scanInterval = null
  }
  document.querySelectorAll(".od-field-button, .od-field-menu, .od-assistant-shell").forEach((node) => node.remove())
  activeMenu = null
  activeField = null
  shell = null
  enabled = false
  window.removeEventListener("scroll", positionButtons, true)
  window.removeEventListener("resize", positionButtons)
  document.removeEventListener("focusin", handleFocusIn)
  document.removeEventListener("pointerover", handlePointerOver)
  document.removeEventListener("visibilitychange", handleVisibilityChange)
}

function handleFocusIn(event: FocusEvent) {
  if (event.target instanceof Element && isEligibleField(event.target)) {
    ensureButton(event.target)
    positionButtons()
  }
}

function handlePointerOver(event: PointerEvent) {
  if (event.target instanceof Element && isEligibleField(event.target)) {
    ensureButton(event.target)
    positionButtons()
  }
}

function handleVisibilityChange() {
  if (!document.hidden) {
    scheduleScan()
  }
}

function scheduleScan(delay = 80) {
  if (!enabled || scanTimer !== null) return
  scanTimer = window.setTimeout(() => {
    scanTimer = null
    scanFields()
  }, delay)
}

function scanFields() {
  if (!enabled) return
  document.querySelectorAll("textarea, input, [contenteditable='true']").forEach((element) => {
    if (isEligibleField(element)) {
      ensureButton(element)
    }
  })
  positionButtons()
}

function ensureButton(field: EditableField) {
  if (buttons.has(field)) return
  const button = document.createElement("button")
  button.className = "od-field-button"
  button.type = "button"
  button.title = "Generate answer with Opportunity Desk"
  button.textContent = "✦"
  button.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    void openMenu(field)
  })
  document.documentElement.append(button)
  buttons.set(field, button)
}

function positionButtons() {
  document.querySelectorAll<HTMLButtonElement>(".od-field-button").forEach((button) => {
    const field = [...document.querySelectorAll<EditableField>("textarea, input, [contenteditable='true']")].find(
      (candidate) => buttons.get(candidate) === button
    )
    if (!field || !isEligibleField(field)) {
      button.remove()
      return
    }
    const rect = field.getBoundingClientRect()
    button.style.left = `${Math.max(8, rect.right - 34)}px`
    button.style.top = `${Math.max(8, rect.top + rect.height / 2 - 14)}px`
  })
  positionActiveMenu()
}

async function openMenu(field: EditableField) {
  activeMenu?.remove()
  activeField = field
  const descriptor = describeField(field)
  const menu = document.createElement("div")
  menu.className = "od-field-menu"
  menu.innerHTML = `
    <div class="od-menu-header">
      <span class="od-menu-title">Opportunity Desk</span>
      <button class="od-icon-button" type="button" data-action="close">x</button>
    </div>
    <div class="od-menu-body">
      <label class="od-question-field">
        <span>Question or instruction</span>
        <textarea data-role="question" placeholder="Edit what the AI should answer">${escapeHtml(descriptor.questionText)}</textarea>
      </label>
      <button class="od-menu-button" type="button" data-action="generate">Generate answer</button>
      <div class="od-suggestion-list" data-role="suggestions"></div>
      <textarea class="od-answer-box" data-role="answer" placeholder="Generated answer appears here"></textarea>
      <div class="od-menu-actions">
        <button class="od-menu-button" type="button" data-action="replace">Replace</button>
        <button class="od-menu-button secondary" type="button" data-action="append">Append</button>
        <button class="od-menu-button secondary" type="button" data-action="save">Save</button>
      </div>
      <div class="od-menu-error" data-role="error"></div>
    </div>
  `
  document.documentElement.append(menu)
  activeMenu = menu
  positionMenu(menu, field)

  const answer = menu.querySelector<HTMLTextAreaElement>("[data-role='answer']")!
  const question = menu.querySelector<HTMLTextAreaElement>("[data-role='question']")!
  const errorBox = menu.querySelector<HTMLDivElement>("[data-role='error']")!
  const suggestionsBox = menu.querySelector<HTMLDivElement>("[data-role='suggestions']")!
  const generated = { id: "", keyword: descriptor.keyword }
  answer.value = getFieldValue(field)

  const currentDescriptor = () => {
    const questionText = question.value.trim() || descriptor.questionText
    return {
      ...descriptor,
      keyword: inferKeyword(questionText),
      questionText
    }
  }

  menu.addEventListener("click", (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const action = target.dataset.action
    if (action === "close") {
      menu.remove()
      activeMenu = null
      activeField = null
    }
    if (action === "replace") {
      setFieldValue(field, answer.value)
    }
    if (action === "append") {
      setFieldValue(field, [getFieldValue(field), answer.value].filter(Boolean).join("\n\n"))
    }
    if (action === "save") {
      const sourceText = answer.value.trim() || getFieldValue(field).trim()
      const nextDescriptor = currentDescriptor()
      void saveSuggestion(generated.id ? generated.keyword : nextDescriptor.keyword, sourceText, nextDescriptor.questionText, generated.id, errorBox)
    }
    if (action === "generate") {
      void generateAnswer(target as HTMLButtonElement, currentDescriptor(), answer, errorBox, generated)
    }
  })

  await loadSuggestions(descriptor.keyword, suggestionsBox, answer, errorBox)
  positionMenu(menu, field)
}

function positionActiveMenu() {
  if (activeMenu && activeField && isEligibleField(activeField)) {
    positionMenu(activeMenu, activeField)
  }
}

function positionMenu(menu: HTMLDivElement, field: EditableField) {
  const margin = 12
  const gap = 8
  const visualViewport = window.visualViewport
  const viewportLeft = visualViewport?.offsetLeft ?? 0
  const viewportTop = visualViewport?.offsetTop ?? 0
  const viewportWidth = visualViewport?.width ?? window.innerWidth
  const viewportHeight = visualViewport?.height ?? window.innerHeight
  const viewportRight = viewportLeft + viewportWidth
  const viewportBottom = viewportTop + viewportHeight
  const maxWidth = Math.max(280, viewportWidth - margin * 2)
  const menuWidth = Math.min(360, maxWidth)
  const rect = field.getBoundingClientRect()

  menu.style.width = `${menuWidth}px`
  menu.style.maxHeight = `${Math.max(220, viewportHeight - margin * 2)}px`
  menu.style.overflowY = "auto"

  const measuredHeight = Math.min(menu.scrollHeight, viewportHeight - margin * 2)
  const belowTop = rect.bottom + gap
  const aboveTop = rect.top - measuredHeight - gap
  const belowSpace = viewportBottom - margin - belowTop
  const aboveSpace = aboveTop - viewportTop - margin
  const preferredTop = belowSpace >= measuredHeight || belowSpace >= aboveSpace ? belowTop : aboveTop
  const top = clamp(preferredTop, viewportTop + margin, viewportBottom - measuredHeight - margin)
  const left = clamp(rect.left, viewportLeft + margin, viewportRight - menuWidth - margin)

  menu.style.left = `${left}px`
  menu.style.top = `${top}px`
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return min
  return Math.min(max, Math.max(min, value))
}

async function generateAnswer(
  button: HTMLButtonElement,
  descriptor: ReturnType<typeof describeField>,
  answer: HTMLTextAreaElement,
  errorBox: HTMLDivElement,
  generated: { id: string; keyword: string }
) {
  button.setAttribute("disabled", "true")
  errorBox.textContent = ""
  try {
    const response = await sendMessage<FieldAssistantGenerateResult>({
      type: FIELD_ASSISTANT_MESSAGE_TYPES.generateForField,
      payload: { ...descriptor, scopeUrl: location.href }
    })
    if (!response.ok) {
      throw new Error("error" in response ? response.error : "Could not generate answer.")
    }
    generated.id = response.generationId
    generated.keyword = response.keyword
    answer.value = response.answerText
  } catch (error) {
    errorBox.textContent = error instanceof Error ? error.message : "Could not generate answer."
  } finally {
    button.removeAttribute("disabled")
    positionActiveMenu()
  }
}

async function loadSuggestions(keyword: string, box: HTMLDivElement, answer: HTMLTextAreaElement, errorBox: HTMLDivElement) {
  const response = await sendMessage<{ ok: boolean; suggestions?: Array<{ id: string; response_text: string }>; error?: string }>({
    type: FIELD_ASSISTANT_MESSAGE_TYPES.listSuggestions,
    payload: { keyword }
  }).catch((error: Error) => ({ ok: false, error: error.message }) as { ok: boolean; suggestions?: Array<{ id: string; response_text: string }>; error?: string })
  if (!response.ok || !response.suggestions?.length) return
  box.textContent = ""
  for (const suggestion of response.suggestions) {
    const button = document.createElement("button")
    button.className = "od-suggestion-button"
    button.type = "button"
    button.textContent = suggestion.response_text.slice(0, 220)
    button.addEventListener("click", () => {
      answer.value = suggestion.response_text
      sendMessage({ type: FIELD_ASSISTANT_MESSAGE_TYPES.markSuggestionUsed, payload: { suggestionId: suggestion.id } }).catch(() => undefined)
      errorBox.textContent = ""
      positionActiveMenu()
    })
    box.append(button)
  }
}

async function saveSuggestion(keyword: string, answerText: string, questionText: string, generationId: string, errorBox: HTMLDivElement) {
  if (!answerText.trim()) return
  const response = await sendMessage<{ ok: boolean; error?: string }>({
    type: FIELD_ASSISTANT_MESSAGE_TYPES.saveSuggestion,
    payload: { keyword, answerText, generationId, fieldContextSummary: questionText }
  }).catch((error: Error) => ({ ok: false, error: error.message }))
  errorBox.textContent = response.ok ? "Saved for this keyword." : response.error || "Could not save answer."
}

function getFieldValue(field: EditableField) {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    return field.value
  }
  return field.textContent || ""
}

function setFieldValue(field: EditableField, value: string) {
  field.focus()
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    field.value = value
  } else {
    field.textContent = value
  }
  field.dispatchEvent(new Event("input", { bubbles: true }))
  field.dispatchEvent(new Event("change", { bubbles: true }))
}

function renderShell(status?: FieldAssistantPageStatus) {
  if (!enabled) return
  shell ||= document.createElement("div")
  shell.className = "od-assistant-shell"
  shell.dataset.minimized = shell.dataset.minimized || "false"
  shell.innerHTML = `
    <div class="od-shell-header">
      <span class="od-shell-title">Opportunity Desk</span>
      <div class="od-shell-actions">
        <button class="od-icon-button" type="button" data-action="minimize">-</button>
        <button class="od-icon-button" type="button" data-action="close">x</button>
      </div>
    </div>
    <div class="od-shell-body">
      <span data-role="shell-status">${escapeHtml(status?.message || "Field assistant is active on this page.")}</span>
      <div class="od-shell-buttons">
        <button class="od-shell-button" type="button" data-action="fill-saved">Fill saved</button>
        <button class="od-shell-button primary" type="button" data-action="fill-ai">Fill with AI</button>
      </div>
    </div>
  `
  if (!shell.isConnected) {
    document.documentElement.append(shell)
  }
  shell.onclick = handleShellClick
}

function handleShellClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (target.dataset.action === "close") {
    shell?.remove()
    shell = null
  }
  if (target.dataset.action === "minimize" && shell) {
    const minimized = shell.dataset.minimized !== "true"
    shell.dataset.minimized = String(minimized)
    const body = shell.querySelector<HTMLElement>(".od-shell-body")
    if (body) body.hidden = minimized
  }
  if (target.dataset.action === "fill-saved") {
    void autofillVisibleFields({ useAiForMissing: false })
  }
  if (target.dataset.action === "fill-ai") {
    void autofillVisibleFields({ useAiForMissing: true })
  }
}

async function autofillVisibleFields(options: { useAiForMissing: boolean }) {
  if (!shell) return
  const status = shell.querySelector<HTMLElement>("[data-role='shell-status']")
  const fields = [...document.querySelectorAll<EditableField>("textarea, input, [contenteditable='true']")]
    .filter((field) => isEligibleField(field))
    .filter((field) => !getFieldValue(field).trim())
  if (!fields.length) {
    if (status) status.textContent = "No empty eligible fields found on this screen."
    return
  }

  let filled = 0
  let generated = 0
  let skipped = 0
  if (status) status.textContent = `Checking ${fields.length} empty fields...`

  for (const field of fields) {
    const descriptor = describeField(field)
    const saved = await findSavedSuggestion(descriptor.keyword)
    if (saved) {
      setFieldValue(field, saved.response_text)
      filled += 1
      continue
    }
    if (!options.useAiForMissing) {
      skipped += 1
      continue
    }
    const answer = await generateAnswerForDescriptor(descriptor).catch(() => null)
    if (answer?.answerText) {
      setFieldValue(field, answer.answerText)
      generated += 1
    } else {
      skipped += 1
    }
  }

  if (status) {
    status.textContent = `${filled + generated} fields filled (${filled} saved, ${generated} AI, ${skipped} skipped).`
  }
  positionButtons()
}

async function findSavedSuggestion(keyword: string) {
  const response = await sendMessage<{ ok: boolean; suggestions?: Array<{ id: string; response_text: string }>; error?: string }>({
    type: FIELD_ASSISTANT_MESSAGE_TYPES.listSuggestions,
    payload: { keyword }
  }).catch((error: Error) => ({ ok: false, error: error.message }) as { ok: boolean; suggestions?: Array<{ id: string; response_text: string }>; error?: string })
  const suggestion = response.ok ? response.suggestions?.[0] : null
  if (suggestion) {
    sendMessage({ type: FIELD_ASSISTANT_MESSAGE_TYPES.markSuggestionUsed, payload: { suggestionId: suggestion.id } }).catch(() => undefined)
  }
  return suggestion || null
}

async function generateAnswerForDescriptor(descriptor: ReturnType<typeof describeField>) {
  const response = await sendMessage<FieldAssistantGenerateResult>({
    type: FIELD_ASSISTANT_MESSAGE_TYPES.generateForField,
    payload: { ...descriptor, scopeUrl: location.href }
  })
  if (!response.ok) {
    throw new Error("error" in response ? response.error : "Could not generate answer.")
  }
  return response
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char)
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === FIELD_ASSISTANT_MESSAGE_TYPES.openShell) {
    void refreshStatus().then(() => renderShell())
  }
  if (message.type === FIELD_ASSISTANT_MESSAGE_TYPES.minimizeShell && shell) {
    shell.dataset.minimized = "true"
    const body = shell.querySelector<HTMLElement>(".od-shell-body")
    if (body) body.hidden = true
  }
  if (message.type === FIELD_ASSISTANT_MESSAGE_TYPES.closeShell) {
    shell?.remove()
    shell = null
  }
  if (message.type === FIELD_ASSISTANT_MESSAGE_TYPES.pageStatusChanged) {
    void refreshStatus()
  }
})

void refreshStatus()
