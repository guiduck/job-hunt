import { Sidebar } from "./sidebar";
import { TopStatusBar } from "./top-status-bar";

export function FreelanceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen min-w-0 flex-1">
          <TopStatusBar />
          <main className="p-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
