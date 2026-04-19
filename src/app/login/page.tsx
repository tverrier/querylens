"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const signIn = async (provider: "google" | "github") => {
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 animate-page-enter">
      <h1 className="text-3xl font-semibold">Sign in to QueryLens</h1>
      <p className="mt-2 text-slate-400">Use a provider to continue.</p>
      <div className="mt-8 space-y-3">
        <button
          onClick={() => signIn("google")}
          className="w-full rounded-lg border border-border px-4 py-3 hover:bg-surface transition-colors"
        >
          Continue with Google
        </button>
        <button
          onClick={() => signIn("github")}
          className="w-full rounded-lg border border-border px-4 py-3 hover:bg-surface transition-colors"
        >
          Continue with GitHub
        </button>
      </div>
    </main>
  );
}
