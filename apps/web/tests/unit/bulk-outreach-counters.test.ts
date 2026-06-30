import { describe, expect, it } from "vitest";

function countStatuses(statuses: string[]) {
  return {
    generatedCount: statuses.filter((status) =>
      ["generated", "approved", "sending", "sent", "failed_send"].includes(status)
    ).length,
    skippedCount: statuses.filter((status) => status === "skipped").length,
    invalidContactCount: statuses.filter((status) => status === "invalid_contact").length,
    duplicateCount: statuses.filter((status) => status === "duplicate_blocked").length
  };
}

describe("bulk outreach counters", () => {
  it("recomputes generated, skipped, invalid, and duplicate buckets", () => {
    expect(countStatuses(["generated", "skipped", "invalid_contact", "duplicate_blocked"])).toEqual({
      generatedCount: 1,
      skippedCount: 1,
      invalidContactCount: 1,
      duplicateCount: 1
    });
  });
});
