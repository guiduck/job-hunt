import type { SellerSettings } from "@prisma/client";

export function SettingsAlert({ settings }: { settings: SellerSettings | null }) {
  const missing = [
    settings?.sellerName ? null : "seller name",
    settings?.sellerWhatsapp || settings?.sellerEmail ? null : "contact channel",
    settings?.offerTitle ? null : "offer title",
    settings?.landingPagePrice ? null : "offer price"
  ].filter(Boolean);

  if (missing.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
      Missing generation context: {missing.join(", ")}.
    </div>
  );
}
