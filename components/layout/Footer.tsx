import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="max-w-2xl leading-relaxed">
          SharpLine provides statistical odds data and analysis only — it does
          not facilitate wagering. Gambling involves risk; please play
          responsibly and within your means. If you or someone you know has a
          gambling problem, call the National Council on Problem Gambling
          helpline at{" "}
          <a href="tel:1-800-522-4700" className="underline hover:text-foreground">
            1-800-522-4700
          </a>{" "}
          or visit{" "}
          <a
            href="https://www.ncpgambling.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            ncpgambling.org
          </a>
          .{" "}
          <Link href="/responsible-gambling" className="underline hover:text-foreground">
            Learn more
          </Link>
          .
        </p>
        <nav className="flex shrink-0 gap-4">
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/responsible-gambling" className="hover:text-foreground">
            Responsible Gambling
          </Link>
        </nav>
      </div>
    </footer>
  );
}
