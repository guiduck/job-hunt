import Link from "next/link";
import { DatabaseZap } from "lucide-react";
import { SellerSettingsForm } from "@/components/settings/seller-settings-form";
import { SettingsAlert } from "@/components/settings/settings-alert";
import { Button } from "@/components/ui/button";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { listNiches } from "@/lib/freelance/campaign-service";
import { getChannelSettings } from "@/lib/freelance/channel-settings-service";
import { getSellerSettings } from "@/lib/freelance/settings-service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const scope = await getCurrentUserScope();
  const [settings, niches, channelSettings] = await Promise.all([
    getSellerSettings(scope),
    listNiches(),
    getChannelSettings(scope)
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">Settings</p>
          <h1 className="mt-3 text-3xl font-semibold">Seller settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Configure offer, contact and preference data used in generated commercial messages.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/settings/niches">
            <DatabaseZap className="h-4 w-4" aria-hidden="true" />
            Niche audit
          </Link>
        </Button>
      </div>
      <SettingsAlert settings={settings} />
      <SellerSettingsForm settings={settings} niches={niches} channelSettings={channelSettings} />
    </div>
  );
}
