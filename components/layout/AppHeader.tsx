import Link from "next/link";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bets", label: "My Bets" },
  { href: "/account", label: "Account" },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/dashboard">
          <Logo />
        </Link>
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
