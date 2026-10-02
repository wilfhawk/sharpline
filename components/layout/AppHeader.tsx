import Link from "next/link";
import { Logo } from "./Logo";
import { TierToggle } from "./TierToggle";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", className: "" },
  { href: "/learn", label: "Learn", className: "hidden sm:inline" },
  { href: "/methodology", label: "Methodology", className: "hidden lg:inline" },
  { href: "/status", label: "Status", className: "hidden xl:inline" },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <TierToggle />
        </div>
        <nav className="flex items-center gap-4 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-muted-foreground hover:text-foreground ${link.className}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
