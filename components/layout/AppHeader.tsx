import Link from "next/link";
import { Logo } from "./Logo";
import { getRequestTier } from "@/lib/get-request-tier";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bets", label: "My Bets" },
  { href: "/learn", label: "Learn" },
  { href: "/account", label: "Account" },
];

export async function AppHeader() {
  const tier = isSupabaseConfigured() ? await getRequestTier() : null;

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Logo />
          </Link>
          {tier && (
            <Link
              href="/account"
              className={
                tier === "pro"
                  ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400"
                  : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              }
            >
              {tier === "pro" ? "PRO" : "FREE"}
            </Link>
          )}
        </div>
        <nav className="flex items-center gap-4 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
