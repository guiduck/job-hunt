import {
  MAX_SAVED_SEARCH_KEYWORDS,
  appendKeywordToSearchText,
  buildLinkedInContentSearchUrl,
  buildLinkedInJobsSearchUrl,
  canonicalizeExternalApplicationUrl,
  decodeLinkedInSafetyRedirect,
  matchCuratedExternalSource,
  mergeSavedSearchKeywords,
  normalizeSearchKeywords
} from "./linkedin"

const searchUrl = new URL(
  buildLinkedInContentSearchUrl({
    keywords: "typescript Brazil remote",
    sortMode: "recent"
  })
)

if (searchUrl.searchParams.get("keywords") !== "typescript Brazil remote") {
  throw new Error("LinkedIn content search should preserve the search text.")
}

if (searchUrl.searchParams.has("region") || searchUrl.searchParams.has("geoUrn")) {
  throw new Error("LinkedIn base search URL must not include region parameters.")
}

if (searchUrl.searchParams.get("sortBy") !== '"date_posted"') {
  throw new Error("Recent LinkedIn search should request date posted sort.")
}

const pastMonthSearchUrl = new URL(
  buildLinkedInContentSearchUrl({
    keywords: "vaga react frontend remoto",
    sortMode: "recent",
    pastMonthOnly: true
  })
)

if (pastMonthSearchUrl.searchParams.get("datePosted") !== '"past-month"') {
  throw new Error("Past-month LinkedIn search should request the LinkedIn datePosted facet.")
}

const parsedKeywords = normalizeSearchKeywords("Hiring React react, TypeScript/remoto\njobs")
if (parsedKeywords.join("|") !== "react|typescript|remoto") {
  throw new Error("Search keyword parsing should split words, skip intent terms, and dedupe.")
}

const appended = appendKeywordToSearchText("react", "TypeScript")
if (appended !== "react typescript") {
  throw new Error("Clicking a saved badge should append the keyword to Search text.")
}

const duplicateAppend = appendKeywordToSearchText("react typescript", "typescript")
if (duplicateAppend !== "react typescript") {
  throw new Error("Clicking a saved badge should not duplicate an existing Search term.")
}

const capped = mergeSavedSearchKeywords(
  Array.from({ length: MAX_SAVED_SEARCH_KEYWORDS - 1 }, (_, index) => `term-${index}`),
  "react typescript"
)
if (capped.length !== MAX_SAVED_SEARCH_KEYWORDS || capped.at(-1) !== "react" || capped.includes("typescript")) {
  throw new Error("Saved keyword merge should keep existing order and cap at 30 badges.")
}

const defaultJobsUrl = new URL(buildLinkedInJobsSearchUrl({}))
if (defaultJobsUrl.hostname !== "www.linkedin.com" || !defaultJobsUrl.pathname.includes("/jobs/search")) {
  throw new Error("LinkedIn Jobs default browse should use the classic jobs search URL.")
}

if (defaultJobsUrl.searchParams.has("geoId")) {
  throw new Error("LinkedIn Jobs default URL must not hardcode geography.")
}

const keywordJobsUrl = new URL(
  buildLinkedInJobsSearchUrl({
    searchText: "typescript remote backend",
    mode: "classic_keywords",
    datePosted: "past_week",
    sort: "most_recent"
  })
)
if (keywordJobsUrl.searchParams.get("keywords") !== "typescript OR remote OR backend") {
  throw new Error("LinkedIn Jobs keyword URL should preserve OR-style operator intent.")
}
if (keywordJobsUrl.searchParams.get("f_TPR") !== "r604800" || keywordJobsUrl.searchParams.get("sortBy") !== "DD") {
  throw new Error("LinkedIn Jobs classic URL should include date and recency sort facets.")
}

const redirectUrl = "https://www.linkedin.com/safety/go?url=https%3A%2F%2Fjobs.ashbyhq.com%2Fexample%2Fabc%3Futm_source%3Dlinkedin%26jobId%3D123"
const decodedApplyUrl = decodeLinkedInSafetyRedirect(redirectUrl)
if (decodedApplyUrl !== "https://jobs.ashbyhq.com/example/abc?utm_source=linkedin&jobId=123") {
  throw new Error("LinkedIn safety redirects should decode the official apply URL.")
}

const canonicalApplyUrl = canonicalizeExternalApplicationUrl(redirectUrl)
if (canonicalApplyUrl !== "https://jobs.ashbyhq.com/example/abc?jobId=123") {
  throw new Error("Canonical application URLs should remove tracking parameters and preserve job identity.")
}

const canonicalLinkedInJobUrl = canonicalizeExternalApplicationUrl("https://www.linkedin.com/jobs/view/4445390558/?eBP=NOT_ELIGIBLE_FOR_CHARGING&refId=abc")
if (canonicalLinkedInJobUrl !== null) {
  throw new Error("LinkedIn internal jobs/view URLs should not be treated as external application URLs.")
}

const matchedSource = matchCuratedExternalSource(
  canonicalApplyUrl,
  [{ key: "ashby", domain: "jobs.ashbyhq.com", active: true }],
  ["ashby"]
)
if (matchedSource?.key !== "ashby") {
  throw new Error("Source matching should accept selected curated ATS domains.")
}

const matchedInhireSource = matchCuratedExternalSource(
  "https://brq.inhire.app/vagas/580e4f06-0ea2-4ef0-8015-423507ee2e96/desenvolvedor-frontend",
  [{ key: "inhire", domain: "inhire.app", active: true }],
  ["inhire"]
)
if (matchedInhireSource?.key !== "inhire") {
  throw new Error("Source matching should accept InHire company subdomains.")
}

const matchedInhireFromSelectedKeyOnly = matchCuratedExternalSource(
  "https://premiersoft.inhire.app/vagas/76dd15b5-9826-4074-be82-c5c2713d85e3/desenvolvedor-react-senior-or-remoto?source=linkedin",
  [],
  ["inhire"]
)
if (matchedInhireFromSelectedKeyOnly?.key !== "inhire") {
  throw new Error("Source matching should accept selected source key aliases even when the source list is incomplete.")
}

const matchedGreenhouseAlias = matchCuratedExternalSource(
  "https://job-boards.greenhouse.io/interviewengineering/jobs/8651364002",
  [{ key: "greenhouse", domain: "boards.greenhouse.io", active: true }],
  ["greenhouse"]
)
if (matchedGreenhouseAlias?.key !== "greenhouse") {
  throw new Error("Source matching should accept Greenhouse job-boards aliases.")
}
const matchedGreenhouseByKey = matchCuratedExternalSource(
  "https://some-random-host.example/greenhouse/jobs/apply?job=123",
  [{ key: "greenhouse", domain: "boards.greenhouse.io", active: true }],
  ["greenhouse"]
)
if (matchedGreenhouseByKey?.key !== "greenhouse") {
  throw new Error("Source matching should accept selected source keys contained anywhere in the URL.")
}

const sourceAliasCases: Array<[string, string, string]> = [
  ["ashby", "https://jobs.ashbyhq.com/acme/frontend", "Ashby"],
  ["lever", "https://jobs.lever.co/acme/frontend", "Lever"],
  ["smartrecruiters", "https://jobs.smartrecruiters.com/Acme/123-frontend", "SmartRecruiters"],
  ["trampos", "https://trampos.co/oportunidades/frontend", "Trampos"],
  ["catho", "https://www.catho.com.br/vagas/frontend/123", "Catho"],
  ["gupy", "https://dwsbrazil.gupy.io/jobs/11679787", "Gupy"]
]

for (const [key, url, label] of sourceAliasCases) {
  const matched = matchCuratedExternalSource(url, [], [key])
  if (matched?.key !== key) {
    throw new Error(`Source matching should accept ${label} URLs by substring aliases.`)
  }
}
const inactiveSource = matchCuratedExternalSource(
  "https://jobs.teamtailor.com/example/abc",
  [{ key: "teamtailor", domain: "jobs.teamtailor.com", active: false }],
  ["teamtailor"]
)
if (inactiveSource) {
  throw new Error("Inactive optional sources should not match until enabled.")
}