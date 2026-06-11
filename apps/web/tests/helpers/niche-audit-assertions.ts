import { expect } from "vitest";
import type { NicheAuditReport } from "@/lib/freelance/niche-audit-types";

export function expectAuditShape(report: NicheAuditReport) {
  expect(report).toMatchObject({
    runId: expect.any(String),
    status: expect.stringMatching(/^(passed|warnings|failed)$/),
    createdAt: expect.any(String),
    summary: {
      baselineCount: expect.any(Number),
      approvedCount: expect.any(Number),
      blockingCount: expect.any(Number),
      warningCount: expect.any(Number),
      infoCount: expect.any(Number)
    },
    groupedFindings: {
      blocking: expect.any(Array),
      warning: expect.any(Array),
      info: expect.any(Array)
    }
  });
}

export function expectFinding(report: NicheAuditReport, findingType: string) {
  expect(report.findings.some((finding) => finding.findingType === findingType)).toBe(true);
}

