import { type Prisma } from "@prisma/client";
import {
  BASELINE_NICHES,
  IMOBILIARIA_TEXT_CONVERSION_HINT,
  IMOBILIARIA_VISUAL_CONVERSION_HINT,
  VISUAL_CANDIDATE_NICHES
} from "./niche-reference-data";
import {
  hasEncodingDamage,
  normalizeAlias,
  normalizeDisplayName,
  slugifyNiche
} from "./niche-normalization";
import { freelanceRepositories } from "./repositories";
import type {
  AuditableCandidateRow,
  AuditableNicheRow,
  NicheAuditFindingDto,
  NicheAuditReport,
  NicheAuditSeverity,
  NicheAuditStatus
} from "./niche-audit-types";

function asNumber(value: AuditableNicheRow["conversionHint"]) {
  if (value == null) {
    return null;
  }
  return typeof value === "number" ? value : Number(value.toString());
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function activeApproved(row: AuditableNicheRow) {
  return row.enabled && row.lifecycleStatus === "approved";
}

function finding(input: NicheAuditFindingDto): NicheAuditFindingDto {
  return input;
}

function statusFor(findings: NicheAuditFindingDto[]): NicheAuditStatus {
  if (findings.some((item) => item.severity === "blocking")) {
    return "failed";
  }
  if (findings.some((item) => item.severity === "warning")) {
    return "warnings";
  }
  return "passed";
}

function groupFindings(findings: NicheAuditFindingDto[]) {
  return {
    blocking: findings.filter((item) => item.severity === "blocking"),
    warning: findings.filter((item) => item.severity === "warning"),
    info: findings.filter((item) => item.severity === "info")
  };
}

function countSeverity(findings: NicheAuditFindingDto[], severity: NicheAuditSeverity) {
  return findings.filter((item) => item.severity === severity).length;
}

function catalogKeys(row: AuditableNicheRow) {
  return new Set([
    row.slug,
    slugifyNiche(row.displayName ?? row.name),
    normalizeAlias(row.displayName ?? row.name),
    ...asStringArray(row.aliases).map(normalizeAlias)
  ]);
}

export function buildNicheAuditReport({
  rows,
  candidates = [],
  runId = "preview",
  createdAt = new Date()
}: {
  rows: AuditableNicheRow[];
  candidates?: AuditableCandidateRow[];
  runId?: string;
  createdAt?: Date;
}): NicheAuditReport {
  const activeRows = rows.filter(activeApproved);
  const findings: NicheAuditFindingDto[] = [];
  const rowByAnyKey = new Map<string, AuditableNicheRow>();
  const keyBuckets = new Map<string, AuditableNicheRow[]>();

  for (const row of activeRows) {
    for (const key of catalogKeys(row)) {
      if (!key) {
        continue;
      }
      rowByAnyKey.set(key, row);
      keyBuckets.set(key, [...(keyBuckets.get(key) ?? []), row]);
    }
  }

  for (const reference of BASELINE_NICHES) {
    const matched = rowByAnyKey.get(reference.slug) ?? rowByAnyKey.get(normalizeAlias(reference.displayName));
    if (!matched) {
      findings.push(
        finding({
          severity: "blocking",
          findingType: "missing",
          referenceName: reference.displayName,
          expectedValue: reference.slug,
          message: `${reference.displayName} is missing from the approved baseline catalog.`
        })
      );
    }
  }

  const baselineKeys = new Set(BASELINE_NICHES.flatMap((item) => [item.slug, normalizeAlias(item.displayName)]));
  for (const row of activeRows) {
    const rowKeys = catalogKeys(row);
    const inBaseline = [...rowKeys].some((key) => baselineKeys.has(key));

    if (!inBaseline) {
      findings.push(
        finding({
          severity: "warning",
          findingType: "extra",
          nicheId: row.id,
          currentName: row.displayName ?? row.name,
          currentValue: row.slug,
          message: `${row.displayName ?? row.name} is selectable but is not part of the approved baseline.`
        })
      );
    }

    if (!row.sourcePath || !row.sourceNote) {
      findings.push(
        finding({
          severity: "blocking",
          findingType: "source_missing",
          nicheId: row.id,
          currentName: row.displayName ?? row.name,
          message: `${row.displayName ?? row.name} is selectable without complete source evidence.`
        })
      );
    }

    if (hasEncodingDamage(row.name) || hasEncodingDamage(row.displayName)) {
      findings.push(
        finding({
          severity: row.displayName ? "warning" : "blocking",
          findingType: "encoding_issue",
          nicheId: row.id,
          currentName: row.name,
          expectedValue: normalizeDisplayName(row.name),
          currentValue: row.displayName ?? row.name,
          message: `${row.name} contains encoding damage; use ${normalizeDisplayName(row.name)} for operator-facing display.`
        })
      );
    }

    if (asStringArray(row.queryTerms).length === 0) {
      findings.push(
        finding({
          severity: "blocking",
          findingType: "source_missing",
          nicheId: row.id,
          currentName: row.displayName ?? row.name,
          message: `${row.displayName ?? row.name} is selectable without query terms.`
        })
      );
    }
  }

  for (const [key, matches] of keyBuckets) {
    const uniqueIds = new Set(matches.map((item) => item.id));
    if (uniqueIds.size > 1) {
      findings.push(
        finding({
          severity: "blocking",
          findingType: "duplicate",
          referenceName: key,
          currentValue: matches.map((item) => item.displayName ?? item.name).join(", "),
          message: `Multiple selectable catalog rows share normalized key "${key}".`
        })
      );
    }
  }

  const imobiliaria = activeRows.find((row) =>
    catalogKeys(row).has("imobiliaria") || normalizeAlias(row.displayName ?? row.name) === "imobiliaria"
  );
  if (imobiliaria) {
    const currentHint = asNumber(imobiliaria.conversionHint);
    const approvedOverride = imobiliaria.conversionHintSource === "operator_override";
    if (!approvedOverride && currentHint === IMOBILIARIA_TEXT_CONVERSION_HINT) {
      findings.push(
        finding({
          severity: "blocking",
          findingType: "conversion_hint_mismatch",
          nicheId: imobiliaria.id,
          referenceName: "Imobiliaria",
          expectedValue: String(IMOBILIARIA_VISUAL_CONVERSION_HINT),
          currentValue: String(IMOBILIARIA_TEXT_CONVERSION_HINT),
          message:
            "Imobiliaria keeps text seed 11.0 and visual reference 6.1 visible until an operator-approved value is selected."
        })
      );
    }
  }

  for (const candidate of candidates) {
    if (candidate.status === "deferred" || candidate.status === "proposed") {
      findings.push(
        finding({
          severity: "info",
          findingType: "deferred_candidate",
          candidateId: candidate.id,
          referenceName: candidate.proposedName,
          currentValue: candidate.status,
          message: `${candidate.proposedName} remains a ${candidate.status} candidate and is not selectable.`
        })
      );
    }
  }

  for (const visualCandidate of VISUAL_CANDIDATE_NICHES) {
    if (!rowByAnyKey.has(visualCandidate.proposedSlug) && !rowByAnyKey.has(normalizeAlias(visualCandidate.proposedName))) {
      findings.push(
        finding({
          severity: "info",
          findingType: "deferred_candidate",
          referenceName: visualCandidate.proposedName,
          expectedValue: visualCandidate.proposedSlug,
          message: `${visualCandidate.proposedName} is present in visual references but is not approved into the catalog.`
        })
      );
    }
  }

  const summary = {
    baselineCount: BASELINE_NICHES.length,
    approvedCount: activeRows.length,
    candidateCount: candidates.length,
    unreviewedCandidateCount: candidates.filter((item) => item.status === "proposed").length,
    deferredCandidateCount: candidates.filter((item) => item.status === "deferred").length,
    missingCount: findings.filter((item) => item.findingType === "missing").length,
    extraCount: findings.filter((item) => item.findingType === "extra").length,
    duplicateCount: findings.filter((item) => item.findingType === "duplicate").length,
    encodingIssueCount: findings.filter((item) => item.findingType === "encoding_issue").length,
    conversionMismatchCount: findings.filter((item) => item.findingType === "conversion_hint_mismatch").length,
    sourceMissingCount: findings.filter((item) => item.findingType === "source_missing").length,
    blockingCount: countSeverity(findings, "blocking"),
    warningCount: countSeverity(findings, "warning"),
    infoCount: countSeverity(findings, "info")
  };

  return {
    runId,
    status: statusFor(findings),
    createdAt: createdAt.toISOString(),
    summary,
    findings,
    groupedFindings: groupFindings(findings)
  };
}

export async function runCatalogAudit({ persist = false }: { persist?: boolean } = {}) {
  const [niches, candidates] = await Promise.all([
    freelanceRepositories.niches.findMany({
      orderBy: [{ enabled: "desc" }, { sortOrder: "asc" }, { name: "asc" }]
    }),
    freelanceRepositories.nicheCandidates.findMany()
  ]);

  const initialReport = buildNicheAuditReport({
    rows: niches.map((niche) => ({
      ...niche,
      conversionHint: niche.conversionHint,
      lifecycleStatus: String(niche.lifecycleStatus)
    })),
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      proposedName: candidate.proposedName,
      proposedSlug: candidate.proposedSlug,
      status: String(candidate.status)
    }))
  });

  if (!persist) {
    return initialReport;
  }

  const run = await freelanceRepositories.nicheAuditRuns.create({
    data: {
      status: initialReport.status,
      baselineCount: initialReport.summary.baselineCount,
      approvedCount: initialReport.summary.approvedCount,
      candidateCount: initialReport.summary.candidateCount,
      missingCount: initialReport.summary.missingCount,
      extraCount: initialReport.summary.extraCount,
      duplicateCount: initialReport.summary.duplicateCount,
      encodingIssueCount: initialReport.summary.encodingIssueCount,
        conversionMismatchCount: initialReport.summary.conversionMismatchCount,
        sourceSummary: {
          sourceMissingCount: initialReport.summary.sourceMissingCount,
          unreviewedCandidateCount: initialReport.summary.unreviewedCandidateCount,
          deferredCandidateCount: initialReport.summary.deferredCandidateCount,
          blockingCount: initialReport.summary.blockingCount,
        warningCount: initialReport.summary.warningCount,
        infoCount: initialReport.summary.infoCount
      } as Prisma.InputJsonObject,
      findings: {
        create: initialReport.findings.map((item) => ({
          severity: item.severity,
          findingType: item.findingType,
          nicheId: item.nicheId ?? undefined,
          candidateId: item.candidateId ?? undefined,
          referenceName: item.referenceName ?? undefined,
          currentName: item.currentName ?? undefined,
          expectedValue: item.expectedValue ?? undefined,
          currentValue: item.currentValue ?? undefined,
          message: item.message
        }))
      }
    },
    include: { findings: true }
  });

  return buildNicheAuditReport({
    rows: niches.map((niche) => ({
      ...niche,
      conversionHint: niche.conversionHint,
      lifecycleStatus: String(niche.lifecycleStatus)
    })),
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      proposedName: candidate.proposedName,
      proposedSlug: candidate.proposedSlug,
      status: String(candidate.status)
    })),
    runId: run.id,
    createdAt: run.createdAt
  });
}
