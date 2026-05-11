# Data Model: AI Field Assistant

## Entity: FieldAssistantActivation

Owner-scoped activation rule that controls whether the field assistant may run on an external page.

**Fields**:

- `id`: unique identifier
- `user_id`: owner user identifier
- `scope_type`: `base_domain` or `exact_page`
- `scope_value`: normalized base domain or sanitized exact page URL
- `display_name`: optional operator-friendly label
- `enabled`: boolean
- `created_at`: creation timestamp
- `updated_at`: update timestamp
- `last_used_at`: nullable timestamp updated when assistant runs under this rule

**Validation Rules**:

- `user_id + scope_type + scope_value` must be unique.
- `scope_value` must not include credentials, fragments, or unnecessary tracking query parameters.
- `base_domain` rules match normal subpaths and subdomains for the same base domain.
- `exact_page` rules match only the sanitized exact URL chosen by the operator.
- Disabled rules remain stored for Settings visibility but must not activate the assistant.

**Relationships**:

- Belongs to one `User`.
- Used by extension session state to decide whether content-script assistant UI may appear.

## Entity: FieldResponseSuggestion

Owner-scoped reusable answer for a detected field keyword.

**Fields**:

- `id`: unique identifier
- `user_id`: owner user identifier
- `keyword`: normalized keyword/category, such as `motivation`, `experience`, or `english_level`
- `field_label`: optional sanitized label/question text that produced the response
- `field_context_summary`: optional sanitized summary of page/question context
- `response_text`: saved reusable response text
- `source`: `generated`, `edited`, or `manual`
- `used_count`: number of times reused
- `last_used_at`: nullable timestamp
- `created_at`: creation timestamp
- `updated_at`: update timestamp

**Validation Rules**:

- Suggestions are saved only after explicit operator action.
- At most 3 saved suggestions may remain per `user_id + keyword`.
- `response_text` must not be empty.
- `keyword` must be normalized for grouping, while original field text may be retained only as sanitized metadata.
- Queries must always be owner-scoped.

**Lifecycle**:

1. Operator generates or writes a response.
2. Operator explicitly chooses to save it for a keyword.
3. The system inserts or updates the suggestion.
4. If more than 3 suggestions exist for the same owner+keyword, the least recent or least useful one is removed or superseded.
5. Reuse increments usage metadata.

## Entity: FieldAnswerGeneration

Reviewable one-field generation result. This may be persisted as lightweight audit metadata or represented as an API response only; it must not expose hidden prompt or credential data.

**Fields**:

- `id`: unique identifier when persisted
- `user_id`: owner user identifier
- `keyword`: normalized detected keyword
- `field_label`: sanitized label/question text
- `page_origin`: sanitized page origin/domain
- `status`: `drafted`, `failed`, or `discarded`
- `answer_text`: generated draft answer returned for review
- `error_message`: nullable safe error text
- `created_at`: creation timestamp

**Validation Rules**:

- Generation must require a valid authenticated owner.
- Only sanitized field context can be accepted from the browser.
- Full page DOM, browser cookies, OAuth tokens, secrets, and full resume file contents are never stored from the request.
- Generated answers are not saved as reusable suggestions unless the operator explicitly saves them.

## Entity: AssistantShellState

Tab-local UI state for the persistent shell. This is primarily extension-side state, with optional local storage/session mirror.

**Fields**:

- `tab_id`: browser tab identifier
- `page_url`: sanitized current page URL
- `active_scope`: matched `FieldAssistantActivation`, if any
- `shell_status`: `closed`, `minimized`, or `open`
- `assistant_enabled`: boolean
- `active_field_id`: transient field reference
- `generation_status`: `idle`, `loading`, `ready`, or `error`
- `last_error`: nullable safe error text

**Validation Rules**:

- Shell state is available only for authenticated sessions.
- Field references must be revalidated before insertion.
- Closing or disabling the shell removes page UI until explicitly reopened.

## Existing Entities Used

### UserSettings

Extended or associated with assistant preferences:

- enabled activation scopes management
- optional assistant defaults, such as preferred insertion behavior
- sender profile data already used for AI context, including name, email, portfolio URL, and LinkedIn URL

### Resume/Profile Context

Existing resume/settings data remains the source of truth for grounded answers. The browser receives only final reviewable answer text and safe metadata.
