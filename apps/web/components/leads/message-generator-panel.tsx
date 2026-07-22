"use client";

import { Mail, MessageSquareText, Send } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import type { CommercialTemplate } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type MessageStage = "first_contact" | "follow_up";
type MessageChannel = "whatsapp" | "email";

type CreatedBatch = {
  id: string;
  eligibleCount: number;
  missingContactCount: number;
  invalidContactCount: number;
  duplicateCount: number;
};

type OutreachItem = {
  id: string;
  recipientEmail?: string | null;
  recipientWhatsapp?: string | null;
  recipientPhone?: string | null;
  validationErrorMessage?: string | null;
};

export function MessageGeneratorPanel({
  leadId,
  templates,
  email,
  phone,
  whatsapp
}: {
  leadId: string;
  templates: CommercialTemplate[];
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
}) {
  const first = templates[0];
  const [stage, setStage] = useState<MessageStage>(first?.stage ?? "first_contact");
  const [generationChannel, setGenerationChannel] = useState<MessageChannel>("whatsapp");
  const stageTemplates = useMemo(
    () =>
      templates.filter(
        (template) => template.stage === stage && (template.channel === generationChannel || template.channel === "any")
      ),
    [generationChannel, stage, templates]
  );
  const [templateId, setTemplateId] = useState(first?.id ?? "");
  const [message, setMessage] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [sendChannel, setSendChannel] = useState<MessageChannel>("whatsapp");
  const [recipient, setRecipient] = useState(whatsapp ?? phone ?? "");
  const [subject, setSubject] = useState("Website opportunity");
  const [sendStatus, setSendStatus] = useState<string | undefined>();
  const [isGenerating, startGenerateTransition] = useTransition();
  const [isSending, startSendTransition] = useTransition();

  const canEmail = Boolean(email);
  const canWhatsapp = Boolean(whatsapp || phone);

  function selectSendChannel(nextChannel: MessageChannel) {
    setSendChannel(nextChannel);
    setRecipient(nextChannel === "email" ? email ?? "" : whatsapp ?? phone ?? "");
  }

  function generate() {
    startGenerateTransition(async () => {
      const selectedTemplateId = stageTemplates.some((template) => template.id === templateId)
        ? templateId
        : stageTemplates[0]?.id;
      if (!selectedTemplateId) {
        setMessage("Create or seed a commercial template before generating a message.");
        return;
      }
      const response = await fetch("/api/freelance/generation/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, stage, templateId: selectedTemplateId, channel: generationChannel })
      });
      const body = (await response.json()) as { text?: string; error?: string };
      setTemplateId(selectedTemplateId);
      setMessage(body.text ?? body.error ?? "");
    });
  }

  function openSendDialog() {
    const preferredChannel = canWhatsapp ? "whatsapp" : "email";
    selectSendChannel(preferredChannel);
    setSendStatus(undefined);
    setSendOpen(true);
  }

  function sendMessage() {
    startSendTransition(async () => {
      setSendStatus("Preparing message...");
      try {
        if (!message.trim()) {
          throw new Error("Generate or write a message before sending.");
        }
        if (sendChannel === "email" && !recipient.trim()) {
          throw new Error("This lead does not have an email address.");
        }
        if (sendChannel === "whatsapp" && !recipient.trim()) {
          throw new Error("This lead does not have a WhatsApp or phone number.");
        }

        const createResponse = await fetch("/api/freelance/bulk-outreach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel: sendChannel, leadIds: [leadId], stage })
        });
        const created = (await createResponse.json()) as { batch?: CreatedBatch; items?: OutreachItem[]; error?: string };
        if (!createResponse.ok || !created.batch || !created.items?.[0]) {
          throw new Error(created.error ?? "Could not prepare delivery.");
        }
        if (created.batch.duplicateCount > 0) {
          throw new Error("This lead already has a first-contact message for this channel.");
        }

        const item = created.items[0];
        setSendStatus("Saving final message...");
        const updatePayload =
          sendChannel === "email"
            ? { recipientEmail: recipient, subject, body: message }
            : { recipientWhatsapp: recipient, recipientPhone: recipient, message };
        const updateResponse = await fetch(`/api/freelance/bulk-outreach/${created.batch.id}/items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload)
        });
        const updated = (await updateResponse.json()) as { error?: string; item?: OutreachItem };
        if (!updateResponse.ok) {
          throw new Error(updated.error ?? "Could not save final message.");
        }

        setSendStatus("Sending...");
        const approveResponse = await fetch(`/api/freelance/bulk-outreach/${created.batch.id}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: true })
        });
        const approved = (await approveResponse.json()) as {
          error?: string;
          diagnosticMessage?: string;
          results?: Array<{ status: string; diagnosticMessage?: string }>;
        };
        const result = approved.results?.[0];
        if (!approveResponse.ok || result?.status === "failed_send") {
          throw new Error(result?.diagnosticMessage ?? approved.diagnosticMessage ?? approved.error ?? "Message was not sent.");
        }
        if (result?.status === "duplicate_blocked") {
          throw new Error(result.diagnosticMessage ?? "This lead already has a message for this channel.");
        }
        setSendStatus("Sent successfully.");
      } catch (error) {
        setSendStatus(error instanceof Error ? error.message : "Message was not sent.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[150px_160px_1fr_auto]">
        <Select value={stage} onChange={(event) => setStage(event.target.value as MessageStage)}>
          <option value="first_contact">First contact</option>
          <option value="follow_up">Follow-up</option>
        </Select>
        <Select value={generationChannel} onChange={(event) => setGenerationChannel(event.target.value as MessageChannel)}>
          <option value="whatsapp">WhatsApp style</option>
          <option value="email">Email style</option>
        </Select>
        <Select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
          {stageTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </Select>
        <Button type="button" onClick={generate} disabled={isGenerating}>
          {generationChannel === "email" ? <Mail className="h-4 w-4" aria-hidden="true" /> : <MessageSquareText className="h-4 w-4" aria-hidden="true" />}
          {isGenerating ? "Generating..." : "Generate"}
        </Button>
      </div>

      <textarea
        className="min-h-72 w-full rounded-md border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-100 outline-none focus:border-cyan-400"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Generate a message with AI, then edit it here before sending."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-xs text-slate-500">
          AI uses lead details, review notes, source evidence, website analysis, seller settings, and the selected template as context.
        </p>
        <Button type="button" onClick={openSendDialog} disabled={!message.trim() || (!canWhatsapp && !canEmail)}>
          <Send className="h-4 w-4" aria-hidden="true" />
          Send message
        </Button>
      </div>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="w-[min(94vw,760px)]">
          <DialogHeader>
            <DialogTitle>Send message</DialogTitle>
            <DialogDescription>Edit the final contact and message before confirming delivery.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant={sendChannel === "whatsapp" ? "primary" : "secondary"}
                onClick={() => selectSendChannel("whatsapp")}
                disabled={!canWhatsapp}
              >
                <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                WhatsApp
              </Button>
              <Button
                type="button"
                variant={sendChannel === "email" ? "primary" : "secondary"}
                onClick={() => selectSendChannel("email")}
                disabled={!canEmail}
                title={canEmail ? undefined : "No email captured for this lead"}
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Email
              </Button>
            </div>

            <label className="block space-y-2 text-sm text-slate-300">
              <span>{sendChannel === "email" ? "Recipient email" : "WhatsApp number"}</span>
              <Input value={recipient} onChange={(event) => setRecipient(event.target.value)} />
            </label>

            {sendChannel === "email" ? (
              <label className="block space-y-2 text-sm text-slate-300">
                <span>Subject</span>
                <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
              </label>
            ) : null}

            <label className="block space-y-2 text-sm text-slate-300">
              <span>Message</span>
              <textarea
                className="min-h-64 w-full rounded-md border border-slate-800 bg-slate-950 p-3 text-sm leading-6 text-slate-100 outline-none focus:border-cyan-400"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>

            {sendStatus ? <p className="rounded-md border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200">{sendStatus}</p> : null}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setSendOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={sendMessage} disabled={isSending}>
                <Send className="h-4 w-4" aria-hidden="true" />
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}