import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const initials = (
    user.user_metadata?.full_name ??
    user.email ??
    "U"
  )
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-secondary">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-lg font-semibold tracking-tight text-text-primary"
            >
              QueryLens
            </Link>
            <div className="hidden items-center gap-1 sm:flex">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/history">History</NavLink>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-subtle text-xs font-medium text-accent">
              {initials}
            </div>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-tertiary hover:text-text-primary transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:bg-tertiary hover:text-text-primary transition-colors"
    >
      {children}
    </Link>
  );
}
