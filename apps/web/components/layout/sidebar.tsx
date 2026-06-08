import Link from "next/link";
import { freelanceNavigationItems } from "@/lib/freelance/constants";

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-60 border-r border-slate-900 bg-slate-950 px-4 py-5 md:block">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Opportunity Desk
        </p>
        <p className="mt-1 text-sm text-slate-400">Freelance</p>
      </div>
      <nav className="space-y-1">
        {freelanceNavigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-slate-50"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
