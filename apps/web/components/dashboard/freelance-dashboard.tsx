import Link from "next/link";
import type { FreelanceLead } from "@prisma/client";
import { ArrowRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FreelanceDashboard({
  metrics,
  recentLeads
}: {
  metrics: { totalLeads: number; hotLeads: number; contactedLeads: number };
  recentLeads: FreelanceLead[];
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Total leads", metrics.totalLeads],
          ["Hot leads", metrics.hotLeads],
          ["Contacted", metrics.contactedLeads]
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-100">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent leads</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/leads">
              Open leads
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <div className="flex items-center gap-3 text-slate-400">
              <Target className="h-4 w-4" aria-hidden="true" />
              Start a prospecting job to populate this queue.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  className="flex items-center justify-between gap-4 py-3 hover:text-cyan-300"
                  href={`/leads/${lead.id}`}
                >
                  <span>{lead.businessName}</span>
                  <span className="text-xs text-slate-500">{lead.websiteStatus}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
