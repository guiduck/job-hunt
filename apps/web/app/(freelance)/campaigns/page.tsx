import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignFormDialog } from "@/components/campaigns/campaign-form-dialog";
import { EmptyState, ErrorState } from "@/components/layout/states";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { listCampaigns, listNiches } from "@/lib/freelance/campaign-service";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  try {
    const [niches, campaigns] = await Promise.all([
      listNiches(),
      listCampaigns(await getCurrentUserScope())
    ]);

    return (
      <div className="mx-auto w-full max-w-screen-2xl space-y-5 px-1">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">
              Campaigns
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Prospecting campaigns</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Create BR and international campaigns from the seeded niche catalog.
            </p>
          </div>
          <CampaignFormDialog niches={niches} />
        </div>

        {campaigns.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            description="Create your first Freelance campaign from a niche and locality."
          />
        ) : (
          <div className="grid w-full gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl space-y-5 px-1">
        <h1 className="text-3xl font-semibold">Prospecting campaigns</h1>
        <ErrorState
          message={
            error instanceof Error
              ? `Campaign data is unavailable: ${error.message}`
              : "Campaign data is unavailable."
          }
        />
      </div>
    );
  }
}
