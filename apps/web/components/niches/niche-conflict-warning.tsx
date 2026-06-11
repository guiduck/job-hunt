import { AlertTriangle } from "lucide-react";

export function NicheConflictWarning({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
