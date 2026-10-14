"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** Header "More" dropdown for the less-used pages. */
export function MoreNavMenu({ links, className = "" }: { links: { href: string; label: string }[]; className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`items-center gap-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      >
        More
        <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end">
        {links.map((link) => (
          <DropdownMenuItem key={link.href} render={<Link href={link.href} />}>{link.label}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
