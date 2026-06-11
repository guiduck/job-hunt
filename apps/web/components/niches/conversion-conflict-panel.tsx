import { GitCompareArrows } from "lucide-react";
import {
  IMOBILIARIA_TEXT_CONVERSION_HINT,
  IMOBILIARIA_VISUAL_CONVERSION_HINT
} from "@/lib/freelance/niche-reference-data";
import type { NicheAuditReport } from "@/lib/freelance/niche-audit-types";

export function ConversionConflictPanel({ report }: { report: NicheAuditReport }) {
  const conflict = report.findings.find(
    (finding) => finding.findingType === "conversion_hint_mismatch" && finding.referenceName === "Imobiliaria"
  );

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-800">
          <GitCompareArrows className="h-4 w-4 text-cyan-300" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Imobiliaria conversion hint</h2>
          <p className="mt-1 text-sm text-slate-400">
            Text seed: {IMOBILIARIA_TEXT_CONVERSION_HINT.toFixed(1)} · Visual reference:{" "}
            {IMOBILIARIA_VISUAL_CONVERSION_HINT.toFixed(1)}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-slate-800 bg-slate-900/40 p-3">
          <p className="text-xs text-slate-500">Current text seed value</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">
            {IMOBILIARIA_TEXT_CONVERSION_HINT.toFixed(1)}
          </p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-900/40 p-3">
          <p className="text-xs text-slate-500">Visual reference value</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">
            {IMOBILIARIA_VISUAL_CONVERSION_HINT.toFixed(1)}
          </p>
        </div>
      </div>
      {conflict ? <p className="mt-3 text-sm text-rose-300">{conflict.message}</p> : null}
    </section>
  );
}

