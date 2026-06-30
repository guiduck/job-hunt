import {
  BulkOutreachItemEditor,
  type BulkOutreachItemView
} from "./bulk-outreach-item-editor";

type BulkOutreachReviewProps = {
  channel: "email" | "whatsapp";
  generatedCount?: number;
  failedCount?: number;
  items?: BulkOutreachItemView[];
  onSaveItem?: (itemId: string, payload: Record<string, unknown>) => Promise<void>;
};

export function BulkOutreachReview({
  channel,
  generatedCount = 0,
  failedCount = 0,
  items = [],
  onSaveItem = async () => undefined
}: BulkOutreachReviewProps) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300">
      <p className="font-medium text-slate-100">Generation context</p>
      <p className="mt-1 text-slate-400">
        Drafts use saved lead evidence, website/social status, the selected commercial template, and
        seller settings as grounded context for {channel === "email" ? "Email" : "WhatsApp"}.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Generated {generatedCount}; failed {failedCount}. Review and edit every item before approval.
      </p>
      {items.length > 0 ? (
        <div className="mt-3 grid gap-3">
          {items.map((item) => (
            <BulkOutreachItemEditor key={item.id} item={item} onSave={onSaveItem} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
