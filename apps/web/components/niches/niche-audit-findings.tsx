import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { NicheAuditFindingDto, NicheAuditReport, NicheAuditSeverity } from "@/lib/freelance/niche-audit-types";

const severityOrder: NicheAuditSeverity[] = ["blocking", "warning", "info"];

function severityTone(severity: NicheAuditSeverity) {
  if (severity === "blocking") {
    return "danger";
  }
  if (severity === "warning") {
    return "warning";
  }
  return "info";
}

function FindingRows({ findings }: { findings: NicheAuditFindingDto[] }) {
  if (findings.length === 0) {
    return <p className="text-sm text-slate-500">No findings in this group.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Current</TableHead>
            <TableHead>Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {findings.map((finding, index) => (
            <TableRow key={`${finding.findingType}-${finding.referenceName ?? finding.currentName}-${index}`}>
              <TableCell className="whitespace-nowrap">{finding.findingType.replaceAll("_", " ")}</TableCell>
              <TableCell>{finding.referenceName ?? finding.expectedValue ?? "-"}</TableCell>
              <TableCell>{finding.currentName ?? finding.currentValue ?? "-"}</TableCell>
              <TableCell className="min-w-72 text-slate-300">{finding.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function NicheAuditFindings({ report }: { report: NicheAuditReport }) {
  return (
    <section className="space-y-4">
      {severityOrder.map((severity) => (
        <div key={severity} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Badge tone={severityTone(severity)}>{severity}</Badge>
            <span className="text-sm text-slate-400">{report.groupedFindings[severity].length} findings</span>
          </div>
          <FindingRows findings={report.groupedFindings[severity]} />
        </div>
      ))}
    </section>
  );
}
