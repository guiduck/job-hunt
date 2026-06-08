export function TopStatusBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-900 bg-slate-950 px-5">
      <div>
        <p className="text-sm font-medium text-slate-100">Freelance operations</p>
        <p className="text-xs text-slate-500">Mock provider until credentials are configured</p>
      </div>
      <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">
        Internal
      </span>
    </header>
  );
}
