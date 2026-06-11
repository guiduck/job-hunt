import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessInfoPanel, SourceEvidencePanel } from "@/components/leads/lead-detail-panels";
import { TemperatureBadge, WebsiteStatusBadge } from "@/components/leads/lead-badges";
import { LeadReviewPanel } from "@/components/leads/lead-review-panel";
import { LovablePromptModal } from "@/components/leads/lovable-prompt-modal";
import { MessageGeneratorPanel } from "@/components/leads/message-generator-panel";
import { WebsiteAnalysisPanel } from "@/components/leads/website-analysis-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { getLead } from "@/lib/freelance/lead-service";
import { listCommercialTemplates } from "@/lib/freelance/template-service";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const scope = await getCurrentUserScope();
  const [lead, templates] = await Promise.all([
    getLead(scope, leadId),
    listCommercialTemplates(scope)
  ]);

  if (!lead) {
    notFound();
  }

  const analysis = lead.websiteAnalyses[0];
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/leads">Back</Link>
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{lead.businessName}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {lead.city}, {lead.country} - {lead.category}
          </p>
        </div>
        <div className="flex gap-2">
          <WebsiteStatusBadge status={lead.websiteStatus} />
          <TemperatureBadge temperature={lead.temperature} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <BusinessInfoPanel lead={lead} />
          <SourceEvidencePanel lead={lead} />
          <WebsiteAnalysisPanel analysis={analysis} score={lead.leadScore} />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadReviewPanel
                leadId={lead.id}
                commercialStatus={lead.commercialStatus}
                temperature={lead.temperature}
                demoUrl={lead.demoUrl}
                operatorNotes={lead.operatorNotes}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lovable prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <LovablePromptModal leadId={lead.id} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Commercial message</CardTitle>
            </CardHeader>
            <CardContent>
              <MessageGeneratorPanel leadId={lead.id} templates={templates} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
