"use client";

import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { GeneratedTextEditor } from "./generated-text-editor";

export function LovablePromptModal({ leadId }: { leadId: string }) {
  const [variant, setVariant] = useState("complete");
  const [output, setOutput] = useState("");
  const [isPending, startTransition] = useTransition();

  function generate() {
    startTransition(async () => {
      const response = await fetch("/api/freelance/generation/lovable-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, variant })
      });
      const body = (await response.json()) as { text?: string; error?: string };
      setOutput(body.text ?? body.error ?? "");
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Select value={variant} onChange={(event) => setVariant(event.target.value)}>
          <option value="complete">Complete</option>
          <option value="generic">Generic</option>
          <option value="compact">Compact</option>
        </Select>
        <Button type="button" onClick={generate} disabled={isPending}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Generate prompt
        </Button>
      </div>
      {output ? <GeneratedTextEditor value={output} /> : null}
    </div>
  );
}
