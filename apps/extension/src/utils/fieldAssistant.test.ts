import {
  inferKeyword,
  isSensitiveFieldMeta,
  matchesActivation,
  normalizeBaseDomain,
  normalizeExactPage
} from "./fieldAssistant"

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

assert(normalizeBaseDomain("https://www.example.com/jobs/123") === "example.com", "base domain should drop www")
assert(
  normalizeExactPage("https://example.com/jobs/123?utm_source=x&keep=1#section") === "https://example.com/jobs/123?keep=1",
  "exact page should drop tracking params and fragments"
)
assert(
  matchesActivation("https://www.example.com/jobs/123", {
    id: "1",
    scope_type: "base_domain",
    scope_value: "example.com",
    display_name: null,
    enabled: true,
    created_at: "",
    updated_at: "",
    last_used_at: null
  }),
  "base-domain activation should match subpaths"
)
assert(isSensitiveFieldMeta({ fieldName: "password" }), "password fields should be sensitive")
assert(inferKeyword("Why do you want to work here?") === "motivation", "motivation keyword should be inferred")
assert(inferKeyword("Describe your React and TypeScript stack") === "stack", "stack keyword should be inferred")
