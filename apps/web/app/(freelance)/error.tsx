"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FreelanceError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-red-100">
      <h1 className="text-lg font-semibold">Unable to load this workspace view</h1>
      <p className="mt-2 text-sm text-red-100/80">{error.message}</p>
      <Button className="mt-4" type="button" variant="secondary" onClick={reset}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Retry
      </Button>
    </div>
  );
}
