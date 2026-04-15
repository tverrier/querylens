"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const signIn = async (provider: "google" | "github") => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold">Sign in to QueryLens</h1>
      <p className="mt-2 text-slate-400">Use a provider to continue.</p>
      <div className="mt-8 space-y-3">
        <button
          onClick={() => signIn("google")}
          className="w-full rounded border border-slate-700 px-4 py-3 hover:bg-slate-800"
        >
          Continue with Google
        </button>
        <button
          onClick={() => signIn("github")}
          className="w-full rounded border border-slate-700 px-4 py-3 hover:bg-slate-800"
        >
          Continue with GitHub
        </button>
      </div>
    </main>
  );
}
