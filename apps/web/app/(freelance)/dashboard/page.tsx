import Link from "next/link";
import { FreelanceDashboard } from "@/components/dashboard/freelance-dashboard";
import { Button } from "@/components/ui/button";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { getDashboardMetrics, listRecentLeads } from "@/lib/freelance/metrics-service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const scope = await getCurrentUserScope();
  const [metrics, recentLeads] = await Promise.all([
    getDashboardMetrics(scope),
    listRecentLeads(scope)
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">
            Freelance
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Track campaigns, saved businesses and commercial follow-up readiness.
          </p>
        </div>
        <Button asChild>
          <Link href="/campaigns">Create campaign</Link>
        </Button>
      </div>

      <FreelanceDashboard metrics={metrics} recentLeads={recentLeads} />
    </div>
  );
}
