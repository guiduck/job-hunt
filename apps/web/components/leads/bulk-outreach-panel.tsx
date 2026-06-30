import { Button } from "@/components/ui/button";
import { BulkOutreachReview } from "./bulk-outreach-review";
import type { BulkOutreachItemView } from "./bulk-outreach-item-editor";

type BulkOutreachPanelProps = {
  batch?: {
    id: string;
    channel: "email" | "whatsapp";
    status: string;
    selectedCount: number;
    eligibleCount: number;
    missingContactCount: number;
    invalidContactCount: number;
    duplicateCount: number;
    generatedCount?: number;
    failedCount?: number;
  };
  error?: string;
  generating?: boolean;
  approving?: boolean;
  onGenerate?: () => void;
  onApprove?: () => void;
  items?: BulkOutreachItemView[];
  onSaveItem?: (itemId: string, payload: Record<string, unknown>) => Promise<void>;
  deliveryResults?: Array<{
    itemId: string;
    status: string;
    providerName?: string;
    providerMessageId?: string;
    diagnosticCode?: string;
    diagnosticMessage?: string;
  }>;
  channelReadiness?: {
    status: string;
    providerName: string;
    missingEnvVars?: string[];
    diagnosticMessage?: string;
    remainingToday?: number;
  };
};

export function BulkOutreachPanel({
  batch,
  error,
  generating,
  approving,
  onGenerate,
  onApprove,
  items,
  onSaveItem,
  deliveryResults = [],
  channelReadiness
}: BulkOutreachPanelProps) {
  if (!batch && !error) {
    return null;
  }

  const hasEligibleItems = Boolean(batch && batch.eligibleCount > 0);
  const channelLabel = batch?.channel === "email" ? "Email" : "WhatsApp";
  const noEligibleMessage =
    batch?.channel === "email"
      ? "No selected leads have saved email addresses. Email drafts were not generated; use WhatsApp or add emails first."
      : "No selected leads have WhatsApp-ready phone numbers. WhatsApp drafts were not generated; add phone numbers first.";
  const reviewItems = items?.filter(
    (item) => !["missing_contact", "duplicate_blocked"].includes(item.status)
  );

  return (
    <section className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {batch ? (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">
              {batch.channel === "email" ? "Email outreach" : "WhatsApp outreach"}
            </p>
            <h2 className="mt-1 text-lg font-semibold">Batch created</h2>
            <p className="text-xs text-slate-500">Batch {batch.id}</p>
          </div>
          <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-5">
            <span>Selected: {batch.selectedCount}</span>
            <span>Eligible: {batch.eligibleCount}</span>
            <span>Missing: {batch.missingContactCount}</span>
            <span>Invalid: {batch.invalidContactCount}</span>
            <span>Duplicate: {batch.duplicateCount}</span>
            <span>Generated: {batch.generatedCount ?? 0}</span>
            <span>Failed: {batch.failedCount ?? 0}</span>
          </div>
          {batch.missingContactCount > 0 ? (
            <p className="text-sm text-amber-200">
              Leads without a{" "}
              {batch.channel === "email" ? "saved email address" : "WhatsApp-ready phone number"}{" "}
              are excluded from this {channelLabel} batch and do not block eligible leads.
            </p>
          ) : null}
          {!hasEligibleItems ? <p className="text-sm text-slate-400">{noEligibleMessage}</p> : null}
          {onGenerate ? (
            <Button size="sm" onClick={onGenerate} disabled={generating || !hasEligibleItems}>
              {generating ? "Generating..." : "Generate drafts"}
            </Button>
          ) : null}
          {batch.generatedCount ? (
            <div className="space-y-2 rounded-md border border-slate-800 bg-slate-900/60 p-3 text-sm">
              <p className="font-medium text-slate-100">Delivery approval</p>
              <p className="text-slate-400">
                Approving sends only reviewed {channelLabel} items.
                Skipped, duplicate, invalid, missing-contact, and failed-generation items stay excluded.
              </p>
              {channelReadiness?.diagnosticMessage ? (
                <p className="text-xs text-amber-300">
                  {channelReadiness.diagnosticMessage}
                  {channelReadiness.missingEnvVars?.length
                    ? ` Missing env: ${channelReadiness.missingEnvVars.join(", ")}.`
                    : ""}
                </p>
              ) : null}
              <Button size="sm" onClick={onApprove} disabled={approving || !onApprove}>
                {approving ? "Approving..." : `Approve ${batch.channel === "email" ? "Email" : "WhatsApp"} delivery`}
              </Button>
            </div>
          ) : null}
          {deliveryResults.length > 0 ? (
            <div className="rounded-md border border-slate-800 p-3 text-sm text-slate-300">
              <p className="font-medium text-slate-100">Delivery outcomes</p>
              <div className="mt-2 grid gap-1">
                {deliveryResults.map((result) => (
                  <p key={result.itemId} className="text-xs">
                    {result.itemId}: {result.status}
                    {result.providerName ? ` via ${result.providerName}` : ""}
                    {result.diagnosticMessage ? ` - ${result.diagnosticMessage}` : ""}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
          {batch.generatedCount || batch.failedCount ? (
            <BulkOutreachReview
              channel={batch.channel}
              generatedCount={batch.generatedCount}
              failedCount={batch.failedCount}
              items={reviewItems}
              onSaveItem={onSaveItem}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
