"use client";

import { Save } from "lucide-react";
import { useState, useTransition } from "react";
import type { SellerSettings } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PreferredNichesSelector } from "./preferred-niches-selector";
import { ChannelSettingsPanel } from "./channel-settings-panel";

function selectedNiches(settings: SellerSettings | null) {
  return Array.isArray(settings?.preferredNicheIds)
    ? settings.preferredNicheIds.filter((item): item is string => typeof item === "string")
    : [];
}

export function SellerSettingsForm({
  settings,
  niches,
  channelSettings
}: {
  settings: SellerSettings | null;
  niches: { id: string; name: string }[];
  channelSettings?: React.ComponentProps<typeof ChannelSettingsPanel>["items"];
}) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function save(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/freelance/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultMarketScope: formData.get("defaultMarketScope"),
          sellerName: formData.get("sellerName"),
          sellerTitle: formData.get("sellerTitle"),
          sellerEmail: formData.get("sellerEmail"),
          sellerWhatsapp: formData.get("sellerWhatsapp"),
          portfolioUrl: formData.get("portfolioUrl"),
          defaultCountry: formData.get("defaultCountry"),
          defaultCurrency: formData.get("defaultCurrency"),
          offerTitle: formData.get("offerTitle"),
          offerDescription: formData.get("offerDescription"),
          landingPagePrice: formData.get("landingPagePrice") || undefined,
          installments: formData.get("installments") || undefined,
          deliveryTime: formData.get("deliveryTime"),
          preferredNicheIds: formData.getAll("preferredNicheIds"),
          extraContext: formData.get("extraContext")
        })
      });
      setMessage(response.ok ? "Settings saved" : "Unable to save settings");
    });
  }

  return (
    <div className="space-y-4">
      <ChannelSettingsPanel items={channelSettings} />
    <form action={save} className="space-y-4 rounded-lg border border-slate-800 bg-slate-950 p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Select name="defaultMarketScope" defaultValue={settings?.defaultMarketScope ?? "BR"}>
          <option value="BR">Brazil</option>
          <option value="INTERNATIONAL">International</option>
        </Select>
        <Input name="sellerName" defaultValue={settings?.sellerName ?? ""} placeholder="Seller name" />
        <Input name="sellerTitle" defaultValue={settings?.sellerTitle ?? ""} placeholder="Seller title" />
        <Input name="sellerEmail" defaultValue={settings?.sellerEmail ?? ""} placeholder="seller@email.com" />
        <Input name="sellerWhatsapp" defaultValue={settings?.sellerWhatsapp ?? ""} placeholder="WhatsApp" />
        <Input name="portfolioUrl" defaultValue={settings?.portfolioUrl ?? ""} placeholder="Portfolio or company website URL" />
        <Input name="defaultCountry" defaultValue={settings?.defaultCountry ?? "Brazil"} placeholder="Country" />
        <Input name="defaultCurrency" defaultValue={settings?.defaultCurrency ?? "BRL"} placeholder="Currency" />
        <Input name="landingPagePrice" defaultValue={String(settings?.landingPagePrice ?? "")} placeholder="Price" />
        <Input name="installments" defaultValue={String(settings?.installments ?? "")} placeholder="Installments" />
        <Input name="deliveryTime" defaultValue={settings?.deliveryTime ?? ""} placeholder="Delivery time" />
        <Input name="offerTitle" defaultValue={settings?.offerTitle ?? ""} placeholder="Offer title" />
      </div>
      <textarea
        name="offerDescription"
        defaultValue={settings?.offerDescription ?? ""}
        className="min-h-24 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
        placeholder="Offer details, expected outcome, scope, and delivery terms"
      />
      <PreferredNichesSelector niches={niches} selected={selectedNiches(settings)} />
      <textarea
        name="extraContext"
        defaultValue={settings?.extraContext ?? ""}
        className="min-h-24 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
        placeholder="AI context: positioning, tone, proof, exclusions, and local notes"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          <Save className="h-4 w-4" aria-hidden="true" />
          Save settings
        </Button>
        {message ? <span className="text-xs text-slate-400">{message}</span> : null}
      </div>
    </form>
    </div>
  );
}
