import { EmptyState } from "@/components/layout/states";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadTable } from "@/components/leads/lead-table";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { listLeads } from "@/lib/freelance/lead-service";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  );
  const leads = await listLeads(await getCurrentUserScope(), filters);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">Leads</p>
        <h1 className="mt-3 text-3xl font-semibold">Freelance leads</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Review saved businesses, website signals, scores and commercial status.
        </p>
      </div>
      <LeadFilters defaults={filters} />
      {leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Start prospecting from a campaign to save classified leads."
        />
      ) : (
        <LeadTable leads={leads} />
      )}
    </div>
  );
}
