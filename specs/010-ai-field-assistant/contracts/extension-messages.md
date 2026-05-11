# Extension Message Contract: AI Field Assistant

Messages are internal extension contracts between popup, background, content script, and persistent shell. Payloads must not include secrets, OAuth tokens, full resume files, or full page DOM.

## Activation Messages

### `fieldAssistant:getPageStatus`

**Sender**: popup or shell  
**Receiver**: background/content script  
**Purpose**: Determine whether the current tab has an enabled base-domain or exact-page activation.

**Response**:

```ts
type PageStatus = {
  authenticated: boolean
  enabled: boolean
  scopeType?: "base_domain" | "exact_page"
  scopeValue?: string
  canEnable: boolean
  reason?: "unauthenticated" | "unsupported_scheme" | "disabled" | "enabled"
}
```

### `fieldAssistant:enableCurrent`

**Sender**: popup or shell  
**Receiver**: background  
**Purpose**: Add an activation scope for the current page.

```ts
type EnableCurrentRequest = {
  scopeType: "base_domain" | "exact_page"
}
```

## Shell Messages

### `fieldAssistant:openShell`

**Sender**: popup or extension action  
**Receiver**: background/content script  
**Purpose**: Inject or restore the persistent shell for the active tab.

### `fieldAssistant:minimizeShell`

**Sender**: shell  
**Receiver**: content script/background  
**Purpose**: Collapse the shell to a small affordance.

### `fieldAssistant:closeShell`

**Sender**: shell or popup  
**Receiver**: content script/background  
**Purpose**: Remove shell UI and field overlays from the current tab until reopened.

## Field Messages

### `fieldAssistant:fieldDetected`

**Sender**: content script  
**Receiver**: shell/background  
**Purpose**: Notify UI that an eligible field is active.

```ts
type FieldDetectedPayload = {
  fieldId: string
  keyword: string
  confidence: number
  fieldType: "textarea" | "long_text_input" | "contenteditable"
  labelText: string
}
```

### `fieldAssistant:generateForField`

**Sender**: shell or field menu  
**Receiver**: background/API client  
**Purpose**: Request a backend-generated answer for the active sanitized field context.

```ts
type GenerateForFieldRequest = {
  fieldId: string
  keyword: string
  fieldContext: {
    labelText: string
    placeholder?: string
    fieldType: "textarea" | "long_text_input" | "contenteditable"
    existingValue?: string
    confidence: number
  }
  pageContext: {
    origin: string
    sanitizedUrl?: string
    pageTitle?: string
  }
}
```

### `fieldAssistant:insertIntoField`

**Sender**: shell or field menu  
**Receiver**: content script  
**Purpose**: Insert, replace, or append reviewed text after explicit operator action.

```ts
type InsertIntoFieldRequest = {
  fieldId: string
  text: string
  mode: "replace" | "append" | "insert"
}
```

The content script must revalidate that the referenced field still exists, is editable, and remains eligible before applying text.

## Safety Rules

- No message may include full DOM snapshots.
- No message may include cookies, tokens, secrets, model credentials, or full resume file contents.
- Content script must treat page data as untrusted.
- Background/API client must require an app session before requests.
- Insertion must always be initiated by an explicit operator action.
