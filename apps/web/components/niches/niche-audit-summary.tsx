import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import type { NicheAuditReport } from "@/lib/freelance/niche-audit-types";

const statusCopy = {
  passed: "Passed",
  warnings: "Warnings",
  failed: "Failed"
};

export function NicheAuditSummary({ report }: { report: NicheAuditReport }) {
  const stats = [
    ["Baseline", report.summary.baselineCount],
    ["Approved", report.summary.approvedCount],
    ["Blocking", report.summary.blockingCount],
    ["Warnings", report.summary.warningCount],
    ["Candidates", report.summary.candidateCount],
    ["Unreviewed", report.summary.unreviewedCandidateCount + report.summary.deferredCandidateCount]
  ];

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">Catalog audit</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-100">{statusCopy[report.status]}</h2>
          <p className="mt-1 text-sm text-slate-400">Last run {new Date(report.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-800">
          {report.status === "passed" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-300" aria-hidden="true" />
          ) : report.status === "warnings" ? (
            <AlertTriangle className="h-5 w-5 text-amber-300" aria-hidden="true" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-rose-300" aria-hidden="true" />
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-md border border-slate-800 bg-slate-900/40 p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
          </div>
        ))}
      </div>
      {report.summary.infoCount ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <Info className="h-4 w-4" aria-hidden="true" />
          {report.summary.infoCount} informational candidate/reference notes are included.
        </p>
      ) : null}
    </section>
  );
}
