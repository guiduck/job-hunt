"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function GoogleAuthCallback() {
  const router = useRouter();
  const [message, setMessage] = useState("Connecting Google account...");

  useEffect(() => {
    async function saveSession() {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const error = params.get("error");
      if (error) {
        setMessage(error);
        return;
      }
      const accessToken = params.get("access_token");
      const user = params.get("user");
      if (!accessToken) {
        setMessage("Google sign-in completed, but no app session was returned.");
        return;
      }
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          user: user ? JSON.parse(user) : undefined
        })
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(body?.error ?? "Unable to save Google session.");
        return;
      }
      window.history.replaceState(null, "", "/auth/google/callback");
      router.replace("/dashboard");
      router.refresh();
    }
    void saveSession();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-950 p-6">
        <p className="text-sm font-medium text-cyan-300">Google sign-in</p>
        <h1 className="mt-3 text-2xl font-semibold">{message}</h1>
      </div>
    </main>
  );
}
