import Link from "next/link";
import type { CampaignDto } from "@/lib/freelance/campaign-service";
import { ProspectButton } from "./prospect-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatLocation(campaign: CampaignDto) {
  return [campaign.city, campaign.state || campaign.region, campaign.country]
    .filter(Boolean)
    .join(", ");
}

export function CampaignCard({ campaign }: { campaign: CampaignDto }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{campaign.name}</CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              {campaign.nicheNameSnapshot} - {formatLocation(campaign)}
            </p>
          </div>
          <Badge tone={campaign.status === "ready" ? "success" : "neutral"}>
            {campaign.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-slate-500">Leads</p>
            <p className="mt-1 text-lg font-semibold text-slate-100">{campaign.leadCount}</p>
          </div>
          <div>
            <p className="text-slate-500">Hot</p>
            <p className="mt-1 text-lg font-semibold text-slate-100">{campaign.hotLeadCount}</p>
          </div>
          <div>
            <p className="text-slate-500">Contacted</p>
            <p className="mt-1 text-lg font-semibold text-slate-100">
              {campaign.contactedCount}
            </p>
          </div>
        </div>
        {campaign.conversionHintSnapshot != null ? (
          <p className="mt-4 text-xs text-slate-500">
            Conversion estimate: {campaign.conversionHintSnapshot.toFixed(1)}%
          </p>
        ) : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(96px,auto)_minmax(0,1fr)]">
          <Button variant="secondary" size="sm" className="whitespace-nowrap" asChild>
            <Link href={`/leads?campaignId=${campaign.id}`}>View leads</Link>
          </Button>
          <div className="min-w-0">
            <ProspectButton
              campaignId={campaign.id}
              defaultMaxResults={
                typeof campaign.searchSettings.maxResults === "number"
                  ? campaign.searchSettings.maxResults
                  : 50
              }
              initialJob={campaign.latestProspectingJob}
              disabled={campaign.status === "collecting"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
