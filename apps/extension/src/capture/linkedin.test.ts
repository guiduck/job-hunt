import { buildLinkedInContentSearchUrl } from "./linkedin"

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
