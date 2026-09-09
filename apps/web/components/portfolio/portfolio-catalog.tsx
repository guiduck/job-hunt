"use client";

import { ExternalLink, Github, Search, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PortfolioEntryDto } from "@/lib/freelance/portfolio-service";

function PortfolioCard({ entry }: { entry: PortfolioEntryDto }) {
  const [projectName, setProjectName] = useState(entry.projectName ?? "");
  const [repositoryUrl, setRepositoryUrl] = useState(entry.repositoryUrl ?? "");
  const [demoUrl, setDemoUrl] = useState(entry.demoUrl ?? "");
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const hasSavedExample = Boolean(entry.updatedAt);

  function save() {
    startTransition(async () => {
      setMessage("");
      const response = await fetch(`/api/freelance/portfolio/${entry.nicheId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, repositoryUrl, demoUrl, notes })
      });
      const result = (await response.json()) as { error?: string };
      setMessage(response.ok ? "Projeto salvo." : result.error ?? "Nao foi possivel salvar.");
    });
  }

  function clear() {
    startTransition(async () => {
      setMessage("");
      const response = await fetch(`/api/freelance/portfolio/${entry.nicheId}`, {
        method: "DELETE"
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "Nao foi possivel remover.");
        return;
      }
      setProjectName("");
      setRepositoryUrl("");
      setDemoUrl("");
      setNotes("");
      setMessage("Projeto removido.");
    });
  }

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-950 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-100">{entry.nicheName}</h2>
          <p className="mt-1 text-xs text-slate-500">{entry.nicheSlug}</p>
        </div>
        <span
          className={
            entry.nicheEnabled && entry.nicheLifecycleStatus === "approved"
              ? "rounded-full bg-emerald-950 px-2 py-1 text-xs text-emerald-300"
              : "rounded-full bg-slate-900 px-2 py-1 text-xs text-slate-400"
          }
        >
          {entry.nicheEnabled ? entry.nicheLifecycleStatus : "disabled"}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="space-y-1 text-xs text-slate-400">
          <span>Nome do projeto</span>
          <Input
            aria-label={`Nome do projeto para ${entry.nicheName}`}
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder={`Template para ${entry.nicheName}`}
          />
        </label>
        <label className="space-y-1 text-xs text-slate-400">
          <span>Repositorio GitHub</span>
          <Input
            aria-label={`Repositorio GitHub para ${entry.nicheName}`}
            type="url"
            value={repositoryUrl}
            onChange={(event) => setRepositoryUrl(event.target.value)}
            placeholder="https://github.com/..."
          />
        </label>
        <label className="space-y-1 text-xs text-slate-400">
          <span>Demo publicada</span>
          <Input
            aria-label={`Demo publicada para ${entry.nicheName}`}
            type="url"
            value={demoUrl}
            onChange={(event) => setDemoUrl(event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label className="space-y-1 text-xs text-slate-400">
          <span>Notas internas</span>
          <textarea
            aria-label={`Notas internas para ${entry.nicheName}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-20 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
            placeholder="Escopo, tecnologia ou observacoes para reutilizar este exemplo."
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={save} disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar projeto"}
        </Button>
        {hasSavedExample || projectName || repositoryUrl || demoUrl || notes ? (
          <Button size="sm" variant="ghost" onClick={clear} disabled={isPending}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Limpar
          </Button>
        ) : null}
        {repositoryUrl ? (
          <Button asChild size="sm" variant="secondary">
            <a href={repositoryUrl} target="_blank" rel="noreferrer">
              <Github className="h-4 w-4" aria-hidden="true" />
              GitHub
            </a>
          </Button>
        ) : null}
        {demoUrl ? (
          <Button asChild size="sm" variant="secondary">
            <a href={demoUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Abrir demo
            </a>
          </Button>
        ) : null}
      </div>
      {message ? (
        <p className="mt-3 text-xs text-slate-300" role="status">
          {message}
        </p>
      ) : null}
    </article>
  );
}

export function PortfolioCatalog({ entries }: { entries: PortfolioEntryDto[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleEntries = useMemo(
    () =>
      normalizedQuery
        ? entries.filter((entry) =>
            `${entry.nicheName} ${entry.nicheSlug} ${entry.projectName ?? ""}`
              .toLocaleLowerCase()
              .includes(normalizedQuery)
          )
        : entries,
    [entries, normalizedQuery]
  );
  const configuredCount = entries.filter((entry) => entry.demoUrl || entry.repositoryUrl).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4 md:grid-cols-[1fr_auto] md:items-center">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <Input
            aria-label="Buscar nicho no portfolio"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Buscar nicho ou projeto"
          />
        </label>
        <p className="text-sm text-slate-400">
          {configuredCount} de {entries.length} nichos com exemplo
        </p>
      </div>
      {visibleEntries.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleEntries.map((entry) => (
            <PortfolioCard key={entry.nicheId} entry={entry} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
          Nenhum nicho corresponde a busca.
        </p>
      )}
    </div>
  );
}
