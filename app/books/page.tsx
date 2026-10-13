import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/AppHeader";
import { BookTracker } from "@/components/books/BookTracker";

export const metadata: Metadata = { title: "My Books | SharpLine" };

export default function BooksPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold">My Books</h1>
          <p className="mt-1 text-sm text-muted-foreground">Balances, bet limits, and promos for each sportsbook you use.</p>
        </div>
        <BookTracker />
      </main>
    </>
  );
}
