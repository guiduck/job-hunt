import { formatRawCount } from "./searchHistory"

if (formatRawCount(null) !== "Unknown") {
  throw new Error("Missing raw LinkedIn counts must render as Unknown.")
}

if (formatRawCount(1234) !== (1234).toLocaleString()) {
  throw new Error("Known raw LinkedIn counts should use compact locale formatting.")
}