"use client";

type ChannelSettingView = {
  channel: "email" | "whatsapp";
  providerName: string;
  status: string;
  enabled: boolean;
  displayAddress?: string | null;
  dailyLimit?: number | null;
  remainingToday?: number | null;
  requiredEnvVars?: string[] | unknown;
  missingEnvVars?: string[] | unknown;
  diagnosticMessage?: string | null;
  lastCheckedAt?: string | Date | null;
};

function list(value: ChannelSettingView["missingEnvVars"]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function ChannelSettingsPanel({ items = [] }: { items?: ChannelSettingView[] }) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-100">Outreach channel readiness</p>
        <p className="text-xs text-slate-500">
          Secrets stay in environment variables. Missing configuration is shown by variable name only.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => {
          const missing = list(item.missingEnvVars);
          const required = list(item.requiredEnvVars);
          return (
            <article key={item.channel} className="rounded-md border border-slate-800 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-slate-100">
                  {item.channel === "email" ? "Email" : "WhatsApp"} / {item.providerName}
                </p>
                <span className="text-xs text-slate-400">{item.status}</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Limit {item.remainingToday ?? 0}/{item.dailyLimit ?? 0} today.
              </p>
              {missing.length > 0 ? (
                <p className="mt-2 text-xs text-amber-300">Missing env: {missing.join(", ")}.</p>
              ) : (
                <p className="mt-2 text-xs text-emerald-300">Required env present.</p>
              )}
              {required.length > 0 ? (
                <p className="mt-1 text-xs text-slate-500">Required: {required.join(", ")}.</p>
              ) : null}
              {item.diagnosticMessage ? (
                <p className="mt-2 text-xs text-slate-400">{item.diagnosticMessage}</p>
              ) : null}
              {item.lastCheckedAt ? (
                <p className="mt-2 text-xs text-slate-600">
                  Last checked {new Date(item.lastCheckedAt).toLocaleString()}.
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
