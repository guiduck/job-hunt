"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NicheAuditError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-rose-500/30 bg-rose-500/10 p-4">
      <h1 className="text-lg font-semibold text-rose-100">Catalog audit unavailable</h1>
      <p className="mt-2 text-sm text-rose-200/80">
        The audit could not be generated from the current catalog state.
      </p>
      <Button type="button" className="mt-4" onClick={reset}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Retry
      </Button>
    </div>
  );
}

