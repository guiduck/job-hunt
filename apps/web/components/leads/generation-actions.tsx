"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function GenerationActions({
  leadId,
  templateId
}: {
  leadId: string;
  templateId?: string;
}) {
  const [output, setOutput] = useState("");

  async function generatePrompt() {
    const response = await fetch("/api/freelance/generation/lovable-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, variant: "complete" })
    });
    const body = (await response.json()) as { text?: string };
    setOutput(body.text ?? "");
  }

  async function generateMessage() {
    if (!templateId) {
      setOutput("Create or seed a commercial template before generating a message.");
      return;
    }
    const response = await fetch("/api/freelance/generation/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, stage: "first_contact", templateId })
    });
    const body = (await response.json()) as { text?: string };
    setOutput(body.text ?? "");
  }

  async function copyOutput() {
    if (output) {
      await navigator.clipboard.writeText(output);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={generatePrompt}>
          Generate prompt
        </Button>
        <Button size="sm" variant="secondary" onClick={generateMessage}>
          Generate message
        </Button>
        <Button size="sm" variant="ghost" onClick={copyOutput} disabled={!output}>
          Copy
        </Button>
      </div>
      {output ? (
        <textarea
          className="min-h-52 w-full rounded-md border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100"
          value={output}
          onChange={(event) => setOutput(event.target.value)}
        />
      ) : null}
    </div>
  );
}
