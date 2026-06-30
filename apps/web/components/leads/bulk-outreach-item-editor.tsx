"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type BulkOutreachItemView = {
  id: string;
  leadId: string;
  channel: "email" | "whatsapp";
  status: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  recipientWhatsapp?: string | null;
  subject?: string | null;
  body?: string | null;
  message?: string | null;
  validationErrorCode?: string | null;
  validationErrorMessage?: string | null;
  skipReason?: string | null;
};

type BulkOutreachItemEditorProps = {
  item: BulkOutreachItemView;
  onSave: (itemId: string, payload: Record<string, unknown>) => Promise<void>;
};

export function BulkOutreachItemEditor({ item, onSave }: BulkOutreachItemEditorProps) {
  const [recipientEmail, setRecipientEmail] = useState(item.recipientEmail ?? "");
  const [recipientWhatsapp, setRecipientWhatsapp] = useState(
    item.recipientWhatsapp ?? item.recipientPhone ?? ""
  );
  const [subject, setSubject] = useState(item.subject ?? "");
  const [body, setBody] = useState(item.body ?? "");
  const [message, setMessage] = useState(item.message ?? "");
  const [saving, setSaving] = useState(false);

  async function save(payload: Record<string, unknown>) {
    setSaving(true);
    try {
      await onSave(item.id, payload);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-slate-800 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-100">Lead {item.leadId}</p>
        <span className="text-xs text-slate-500">{item.status}</span>
      </div>
      {item.validationErrorMessage ? (
        <p className="text-xs text-amber-300">{item.validationErrorMessage}</p>
      ) : null}
      {item.channel === "email" ? (
        <div className="grid gap-2">
          <Input
            aria-label="Recipient email"
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
            placeholder="recipient@example.com"
          />
          <Input
            aria-label="Email subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
          />
          <textarea
            aria-label="Email body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="min-h-28 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <Button
            size="sm"
            disabled={saving}
            onClick={() => save({ recipientEmail, subject, body, skip: false })}
          >
            Save email item
          </Button>
        </div>
      ) : (
        <div className="grid gap-2">
          <Input
            aria-label="WhatsApp recipient"
            value={recipientWhatsapp}
            onChange={(event) => setRecipientWhatsapp(event.target.value)}
            placeholder="+15555550123"
          />
          <textarea
            aria-label="WhatsApp message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-28 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <Button
            size="sm"
            disabled={saving}
            onClick={() => save({ recipientWhatsapp, message, skip: false })}
          >
            Save WhatsApp item
          </Button>
        </div>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={saving}
        onClick={() =>
          save({
            skip: item.status !== "skipped",
            skipReason: item.status === "skipped" ? null : "Skipped by operator."
          })
        }
      >
        {item.status === "skipped" ? "Unskip" : "Skip"}
      </Button>
    </div>
  );
}
