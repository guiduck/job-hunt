import type { LinkedInJobsInspectedCandidate } from "./types"

export const LINKEDIN_SAFETY_REDIRECT_FIXTURE =
  "https://www.linkedin.com/safety/go?url=https%3A%2F%2Fjobs.ashbyhq.com%2Fexample%2Fabc%3Futm_source%3Dlinkedin%26jobId%3D123"

export const ATS_APPLY_URL_FIXTURES = {
  ashby: "https://jobs.ashbyhq.com/example/abc",
  lever: "https://jobs.lever.co/example/backend",
  greenhouse: "https://boards.greenhouse.io/example/jobs/123",
  unsupported: "https://micro1.ai/jobs/123"
}

export const EASY_APPLY_ONLY_CARD_FIXTURE: LinkedInJobsInspectedCandidate = {
  linkedinJobUrl: "https://www.linkedin.com/jobs/view/123",
  jobTitle: "Frontend Engineer",
  companyName: "Easy Co",
  locationText: "Remote",
  applyButtonKind: "easy_apply",
  rawApplyHref: null,
  decodedApplyUrl: null,
  canonicalApplyUrl: null,
  sourceKey: null,
  outcome: "skipped_easy_apply",
  skipReason: "LinkedIn Easy Apply job skipped by deterministic rule.",
  pageNumber: 1,
  positionOnPage: 1
}

export const UNSUPPORTED_SOURCE_CARD_FIXTURE: LinkedInJobsInspectedCandidate = {
  linkedinJobUrl: "https://www.linkedin.com/jobs/view/456",
  jobTitle: "Backend Engineer",
  companyName: "Unsupported Co",
  locationText: "Brazil Remote",
  applyButtonKind: "external",
  rawApplyHref: ATS_APPLY_URL_FIXTURES.unsupported,
  decodedApplyUrl: ATS_APPLY_URL_FIXTURES.unsupported,
  canonicalApplyUrl: ATS_APPLY_URL_FIXTURES.unsupported,
  sourceKey: null,
  outcome: "unsupported_source",
  skipReason: "External apply source is not selected or not curated.",
  pageNumber: 1,
  positionOnPage: 2
}