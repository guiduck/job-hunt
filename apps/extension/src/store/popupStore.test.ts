import { resolveOpportunityPageFilters } from "./popupStore"

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
