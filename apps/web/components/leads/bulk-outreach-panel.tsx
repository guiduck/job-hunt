import { AlertCircle, CheckCircle2, LoaderCircle, Send } from "lucide-react";
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

function exclusionSummary(batch: NonNullable<BulkOutreachPanelProps["batch"]>) {
  const parts = [
    batch.missingContactCount > 0 ? `${batch.missingContactCount} without contact` : null,
    batch.invalidContactCount > 0 ? `${batch.invalidContactCount} invalid` : null,
    batch.duplicateCount > 0 ? `${batch.duplicateCount} already contacted` : null
  ].filter(Boolean);

  if (batch.eligibleCount > 0) {
    return parts.length > 0
      ? `${batch.eligibleCount} ready. Skipped automatically: ${parts.join(", ")}.`
      : `${batch.eligibleCount} ready for draft generation.`;
  }

  return parts.length > 0
    ? `No eligible leads. Skipped: ${parts.join(", ")}.`
    : "No eligible leads were found.";
}

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
    return (
      <div className="flex min-h-32 items-center justify-center text-sm text-slate-400">
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        Preparing selected leads...
      </div>
    );
  }

  const hasEligibleItems = Boolean(batch && batch.eligibleCount > 0);
  const channelLabel = batch?.channel === "email" ? "Email" : "WhatsApp";
  const reviewItems = items?.filter(
    (item) => !["missing_contact", "duplicate_blocked"].includes(item.status)
  );

  return (
    <section className="space-y-4" aria-live="polite">
      {error ? (
        <p className="flex items-start gap-2 rounded-md border border-red-900/70 bg-red-950/40 p-3 text-sm text-red-200" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      {batch ? (
        <>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded border border-slate-700 px-2 py-1">
              Selected {batch.selectedCount}
            </span>
            <span className="rounded border border-emerald-800 px-2 py-1 text-emerald-300">
              Ready {batch.eligibleCount}
            </span>
            {batch.missingContactCount > 0 ? (
              <span className="rounded border border-slate-700 px-2 py-1 text-slate-400">
                Missing {batch.missingContactCount}
              </span>
            ) : null}
            {batch.invalidContactCount > 0 ? (
              <span className="rounded border border-amber-800 px-2 py-1 text-amber-300">
                Invalid {batch.invalidContactCount}
              </span>
            ) : null}
            {batch.duplicateCount > 0 ? (
              <span className="rounded border border-slate-700 px-2 py-1 text-slate-400">
                Already contacted {batch.duplicateCount}
              </span>
            ) : null}
          </div>

          <p className="text-sm text-slate-300">{exclusionSummary(batch)}</p>

          {batch.generatedCount ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-800 py-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-slate-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  {batch.generatedCount} {channelLabel} {batch.generatedCount === 1 ? "draft" : "drafts"} ready
                </p>
                {channelReadiness?.diagnosticMessage ? (
                  <p className="mt-1 text-xs text-amber-300">
                    {channelReadiness.diagnosticMessage}
                    {channelReadiness.missingEnvVars?.length
                      ? ` Missing env: ${channelReadiness.missingEnvVars.join(", ")}.`
                      : ""}
                  </p>
                ) : null}
              </div>
              <Button size="sm" onClick={onApprove} disabled={approving || !onApprove}>
                <Send className="h-4 w-4" aria-hidden="true" />
                {approving ? "Sending..." : `Send ${batch.generatedCount}`}
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={onGenerate} disabled={generating || !hasEligibleItems || !onGenerate}>
              {generating ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {generating ? "Generating..." : `Generate ${batch.eligibleCount} ${channelLabel} ${batch.eligibleCount === 1 ? "draft" : "drafts"}`}
            </Button>
          )}

          {deliveryResults.length > 0 ? (
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <h3 className="text-sm font-medium text-slate-100">Delivery results</h3>
              {deliveryResults.map((result) => (
                <p
                  key={result.itemId}
                  className={result.status === "sent" ? "text-xs text-emerald-300" : "text-xs text-red-300"}
                >
                  {result.status}
                  {result.diagnosticCode ? ` [${result.diagnosticCode}]` : ""}
                  {result.diagnosticMessage ? `: ${result.diagnosticMessage}` : ""}
                </p>
              ))}
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
        </>
      ) : null}
    </section>
  );
}
