import { Button } from "@/components/ui/button";

type BulkOutreachCountersProps = {
  selectedCount: number;
  visibleSelectedCount: number;
  hiddenSelectedCount: number;
  onClearHidden: () => void;
};

export function BulkOutreachCounters({
  selectedCount,
  visibleSelectedCount,
  hiddenSelectedCount,
  onClearHidden
}: BulkOutreachCountersProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
      <span>{selectedCount} selected</span>
      <span className="text-slate-500">{visibleSelectedCount} visible</span>
      {hiddenSelectedCount > 0 ? (
        <>
          <span className="text-amber-300">{hiddenSelectedCount} hidden by current filters</span>
          <Button size="sm" variant="ghost" onClick={onClearHidden}>
            Clear hidden
          </Button>
        </>
      ) : null}
    </div>
  );
}
