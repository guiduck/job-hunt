import type { WebsiteAnalysisInput, WebsiteStatus } from "./types";

export function classifyWebsite(input: WebsiteAnalysisInput): WebsiteStatus {
  const url = (input.websiteUrl ?? "").toLowerCase();

  if (!url) {
    return "no_site";
  }
  if (url.includes("instagram.com") || url.includes("facebook.com")) {
    return "social_only";
  }
  if (url.includes("linktr.ee") || url.includes("linktree")) {
    return "linktree";
  }
  if (url.includes("booking.") || url.includes("ifood.") || url.includes("catalog")) {
    return "aggregator";
  }
  if (!url.startsWith("http")) {
    return "broken";
  }
  if (url.includes("example.com")) {
    return "weak_site";
  }

  return "usable_site";
}
