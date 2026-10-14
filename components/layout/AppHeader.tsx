import Link from "next/link";
import { Menu, UserRound } from "lucide-react";
import { Logo } from "./Logo";
import { TierToggle } from "./TierToggle";
import { GamesNavMenu } from "./GamesNavMenu";
import { MoreNavMenu } from "./MoreNavMenu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", className: "hidden sm:inline" },
  { href: "/games", label: "All Games", className: "hidden sm:inline-flex" },
  { href: "/learn", label: "Learn", className: "hidden sm:inline" },
  { href: "/pricing", label: "Pricing", className: "hidden sm:inline" },
];

const MORE_LINKS = [
  { href: "/promos", label: "Promo converter" },
  { href: "/books", label: "My Books" },
  { href: "/learn/earnings", label: "Earnings & Risk" },
  { href: "/methodology", label: "Methodology" },
];

export async function AppHeader() {
  let signedIn = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <TierToggle />
        </div>
        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          <details className="relative sm:hidden"><summary aria-label="Navigation menu" className="cursor-pointer list-none p-1"><Menu className="size-5" /></summary><div className="absolute right-0 top-9 z-30 flex w-44 flex-col gap-3 rounded-md border bg-background p-4 shadow-lg">{NAV_LINKS.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}{MORE_LINKS.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}<Link href={signedIn ? "/account" : "/login"}>{signedIn ? "Account" : "Log in"}</Link></div></details>
          {signedIn ? (
            <Link
              href="/account"
              aria-label="Account"
              title="Account"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <UserRound className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Account</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden text-muted-foreground hover:text-foreground sm:inline"
            >
              Log in
            </Link>
          )}
          {NAV_LINKS.map((link) =>
            link.href === "/games" ? (
              <GamesNavMenu key={link.href} className={link.className} />
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`text-muted-foreground hover:text-foreground ${link.className}`}
              >
                {link.label}
              </Link>
            )
          )}
          <MoreNavMenu links={MORE_LINKS} className="hidden sm:inline-flex" />
          {!signedIn && (
            <Button size="sm" nativeButton={false} render={<Link href="/signup" />}>
              Sign up
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
