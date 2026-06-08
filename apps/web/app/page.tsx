import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">
          Opportunity Desk
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold">
          Freelance prospecting operations
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-300">
          Create campaigns, discover local businesses, review website signals,
          and generate human-reviewed prompts and messages.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-md bg-cyan-400 px-4 text-sm font-medium text-slate-950 transition hover:bg-cyan-300"
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
