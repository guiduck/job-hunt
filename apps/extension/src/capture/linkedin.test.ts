import {
  MAX_SAVED_SEARCH_KEYWORDS,
  appendKeywordToSearchText,
  buildLinkedInContentSearchUrl,
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
