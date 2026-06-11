import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApprovedNicheTable } from "@/components/niches/approved-niche-table";
import { ConversionConflictPanel } from "@/components/niches/conversion-conflict-panel";
import { NicheCandidateList } from "@/components/niches/niche-candidate-list";
import { NicheAuditFindings } from "@/components/niches/niche-audit-findings";
import { NicheAuditSummary } from "@/components/niches/niche-audit-summary";
import { NicheForm } from "@/components/niches/niche-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listNiches } from "@/lib/freelance/campaign-service";
import { runCatalogAudit } from "@/lib/freelance/niche-audit-service";
import { listNicheCandidates } from "@/lib/freelance/niche-candidate-service";

export const dynamic = "force-dynamic";

export default async function NicheAuditPage() {
  const [report, niches, candidates] = await Promise.all([
    runCatalogAudit({ persist: true }),
    listNiches({ includeDisabled: true, includeAuditFields: true }),
    listNicheCandidates()
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">Settings</p>
          <h1 className="mt-3 text-3xl font-semibold">Niche catalog audit</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Review baseline coverage, source evidence, encoding normalization, and conversion conflicts.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Seller settings
          </Link>
        </Button>
      </div>
      <Tabs defaultValue="audit" className="space-y-5">
        <TabsList>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="approved">Approved niches</TabsTrigger>
          <TabsTrigger value="candidates">Candidate review</TabsTrigger>
        </TabsList>
        <TabsContent value="audit" className="space-y-5">
          <NicheAuditSummary report={report} />
          <ConversionConflictPanel report={report} />
          <NicheAuditFindings report={report} />
        </TabsContent>
        <TabsContent value="approved" className="space-y-5">
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Create approved niche</h2>
              <p className="mt-1 text-sm text-slate-400">
                Add operator-approved catalog entries with source evidence and query terms.
              </p>
            </div>
            <NicheForm />
          </section>
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Manage approved catalog</h2>
              <p className="mt-1 text-sm text-slate-400">
                Edit, disable, re-enable, or merge entries without changing historical campaigns.
              </p>
            </div>
            <ApprovedNicheTable niches={niches} />
          </section>
        </TabsContent>
        <TabsContent value="candidates" className="space-y-5">
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Review niche candidates</h2>
              <p className="mt-1 text-sm text-slate-400">
                Approve, reject, defer, or mark reference-derived category suggestions as already covered.
              </p>
            </div>
            <NicheCandidateList candidates={candidates} niches={niches} />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
