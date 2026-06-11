import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getFreelanceCurrentUser } from "@/lib/auth/session";

export async function TopStatusBar() {
  const currentUser = await getFreelanceCurrentUser();

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-900 bg-slate-950 px-5">
      <div>
        <p className="text-sm font-medium text-slate-100">Freelance operations</p>
        <p className="text-xs text-slate-500">Choose SerpApi, Apify, or explicit mock per prospecting run</p>
      </div>
      <div className="flex items-center gap-3">
        {currentUser ? (
          <>
            <span className="max-w-56 truncate text-xs text-slate-400">{currentUser.email}</span>
            <form action="/auth/logout" method="post">
              <Button variant="secondary" size="sm" type="submit">
                Log out
              </Button>
            </form>
          </>
        ) : (
          <Button variant="primary" size="sm" asChild>
            <Link href="/auth/google/start">Connect Google</Link>
          </Button>
        )}
        <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">
          Internal
        </span>
      </div>
    </header>
  );
}
