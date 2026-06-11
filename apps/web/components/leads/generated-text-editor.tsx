"use client";

import { Clipboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function GeneratedTextEditor({ value }: { value: string }) {
  const [text, setText] = useState(value);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-2">
      <textarea
        className="min-h-52 w-full rounded-md border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="flex items-center gap-3">
        <Button size="sm" variant="secondary" type="button" onClick={copy}>
          <Clipboard className="h-4 w-4" aria-hidden="true" />
          Copy
        </Button>
        {copied ? <span className="text-xs text-cyan-300">Copied</span> : null}
      </div>
    </div>
  );
}
