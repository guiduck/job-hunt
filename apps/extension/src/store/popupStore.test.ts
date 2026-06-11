import { opportunityFiltersForLane, resolveOpportunityPageFilters } from "./popupStore"
import type { usePopupStore } from "./popupStore"

const current = { keyword: "react", sort_order: "newest" as const, page: 3, page_size: 50 }

const sameCriteria = resolveOpportunityPageFilters(current, { ...current, page: 4 })
if (sameCriteria.page !== 4) {
  throw new Error("Page navigation should preserve the requested page when criteria are unchanged.")
}

const changedCriteria = resolveOpportunityPageFilters(current, { ...current, keyword: "node", page: 3 })
if (changedCriteria.page !== 1) {
  throw new Error("Changing filters should reset the opportunity page to 1.")
}

if (changedCriteria.page_size !== 50) {
  throw new Error("Opportunity pagination should keep the default page size.")
}

const externalLaneFilters = opportunityFiltersForLane("external_application", {
  contact_available: true,
  job_application_kind: "email",
  send_status: "unsent",
  sort_order: "newest",
  page: 2,
  page_size: 50
})

if (externalLaneFilters.job_application_kind !== "external_application") {
  throw new Error("External lane should request external application jobs.")
}

if ("contact_available" in externalLaneFilters) {
  throw new Error("External lane should not keep email contact filters.")
}

if (externalLaneFilters.send_status !== "unsent") {
  throw new Error("External lane should keep sent/not sent filters.")
}

const emailLaneFilters = opportunityFiltersForLane("email", {
  job_application_kind: "external_application",
  sort_order: "newest",
  page: 1,
  page_size: 50
})

if (emailLaneFilters.job_application_kind !== "email" || emailLaneFilters.contact_available !== true) {
  throw new Error("Email lane should request only jobs with a contact.")
}

type PopupStoreState = ReturnType<typeof usePopupStore.getState>

const searchPreferenceStateContract: Pick<
  PopupStoreState,
  "searchPreference" | "savedSearchKeywords" | "refreshSearchPreference" | "appendSavedSearchKeyword" | "deleteSavedSearchKeyword"
> = {} as PopupStoreState

void searchPreferenceStateContract

const careerPageStateContract: Pick<
  PopupStoreState,
  | "curatedCareerSources"
  | "selectedCareerSourceKeys"
  | "latestCareerPageRun"
  | "careerPageAcceptedLimit"
  | "careerPageInspectedCap"
  | "setSelectedCareerSourceKeys"
  | "setCareerPageAcceptedLimit"
  | "setCareerPageInspectedCap"
  | "startCareerPageSearch"
  | "refreshCareerPageSearch"
> = {} as PopupStoreState

void careerPageStateContract

const externalJobsStateContract: Pick<
  PopupStoreState,
  | "jobsLane"
  | "setJobsLane"
  | "markApplied"
  | "dashboardMetrics"
  | "updateFilters"
> = {} as PopupStoreState

void externalJobsStateContract

const metricContract = ({} as PopupStoreState).dashboardMetrics
const emailMetric: number = metricContract.email_job_count
const externalMetric: number = metricContract.external_unapplied_count

void emailMetric
void externalMetric
