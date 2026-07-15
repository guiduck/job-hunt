"use client";

import { Mail, MessageSquareText } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import type { CommercialTemplate } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { GeneratedTextEditor } from "./generated-text-editor";

type MessageStage = "first_contact" | "follow_up";
type MessageChannel = "whatsapp" | "email";

export function MessageGeneratorPanel({
  leadId,
  templates
}: {
  leadId: string;
  templates: CommercialTemplate[];
}) {
  const first = templates[0];
  const [stage, setStage] = useState<MessageStage>(first?.stage ?? "first_contact");
  const [channel, setChannel] = useState<MessageChannel>("whatsapp");
  const stageTemplates = useMemo(
    () =>
      templates.filter(
        (template) => template.stage === stage && (template.channel === channel || template.channel === "any")
      ),
    [channel, stage, templates]
  );
  const [templateId, setTemplateId] = useState(first?.id ?? "");
  const [output, setOutput] = useState("");
  const [isPending, startTransition] = useTransition();

  function generate() {
    startTransition(async () => {
      const selectedTemplateId = stageTemplates.some((template) => template.id === templateId)
        ? templateId
        : stageTemplates[0]?.id;
      if (!selectedTemplateId) {
        setOutput("Create or seed a commercial template before generating a message.");
        return;
      }
      const response = await fetch("/api/freelance/generation/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, stage, templateId: selectedTemplateId, channel })
      });
      const body = (await response.json()) as { text?: string; error?: string };
      setTemplateId(selectedTemplateId);
      setOutput(body.text ?? body.error ?? "");
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <Select value={stage} onChange={(event) => setStage(event.target.value as MessageStage)}>
          <option value="first_contact">First contact</option>
          <option value="follow_up">Follow-up</option>
        </Select>
        <Select value={channel} onChange={(event) => setChannel(event.target.value as MessageChannel)}>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
        </Select>
        <Select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
          {stageTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </Select>
        <Button type="button" onClick={generate} disabled={isPending}>
          {channel === "email" ? <Mail className="h-4 w-4" aria-hidden="true" /> : <MessageSquareText className="h-4 w-4" aria-hidden="true" />}
          {isPending ? "Generating..." : "Generate"}
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        Uses lead details, review notes, source evidence, website analysis, seller settings, and the selected template as AI context.
      </p>
      {output ? <GeneratedTextEditor value={output} /> : null}
    </div>
  );
}
