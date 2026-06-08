import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">
            Freelance
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Campaign, lead, and generation metrics will appear here as the
            Freelance workflow is implemented.
          </p>
        </div>
        <Button asChild>
          <Link href="/campaigns">Create campaign</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next action</CardTitle>
        </CardHeader>
        <CardContent>
          Start by creating a BR or international prospecting campaign from the
          seeded niche catalog.
        </CardContent>
      </Card>
    </div>
  );
}
