export type NicheAuditSeverity = "info" | "warning" | "blocking";
export type NicheAuditStatus = "passed" | "warnings" | "failed";

export type NicheAuditFindingType =
  | "missing"
  | "extra"
  | "duplicate"
  | "encoding_issue"
  | "conversion_hint_mismatch"
  | "source_missing"
  | "deferred_candidate";

export type NicheAuditFindingDto = {
  id?: string;
  severity: NicheAuditSeverity;
  findingType: NicheAuditFindingType;
  nicheId?: string | null;
  candidateId?: string | null;
  referenceName?: string | null;
  currentName?: string | null;
  expectedValue?: string | null;
  currentValue?: string | null;
  message: string;
};

export type NicheAuditSummary = {
  baselineCount: number;
  approvedCount: number;
  candidateCount: number;
  unreviewedCandidateCount: number;
  deferredCandidateCount: number;
  missingCount: number;
  extraCount: number;
  duplicateCount: number;
  encodingIssueCount: number;
  conversionMismatchCount: number;
  sourceMissingCount: number;
  blockingCount: number;
  warningCount: number;
  infoCount: number;
};

export type NicheAuditReport = {
  runId: string;
  status: NicheAuditStatus;
  createdAt: string;
  summary: NicheAuditSummary;
  findings: NicheAuditFindingDto[];
  groupedFindings: Record<NicheAuditSeverity, NicheAuditFindingDto[]>;
};

export type AuditableNicheRow = {
  id: string;
  name: string;
  displayName: string | null;
  slug: string;
  enabled: boolean;
  conversionHint: number | { toString(): string } | null;
  conversionHintSource: string | null;
  sourcePath: string | null;
  sourceNote: string | null;
  aliases: unknown;
  queryTerms: unknown;
  lifecycleStatus: string;
};

export type AuditableCandidateRow = {
  id: string;
  proposedName: string;
  proposedSlug: string;
  status: string;
};
