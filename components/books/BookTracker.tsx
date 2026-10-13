"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useBookTracker } from "@/hooks/useBookTracker";
import { KNOWN_BOOKS, bookName, bookSiteUrl } from "@/lib/books";
import {
  BOOK_STATUSES,
  PROMO_KINDS,
  PROMO_LABELS,
  activePromos,
  expiringSoon,
  isPromoExpired,
  type BookProfile,
  type BookStatus,
  type Promo,
  type PromoKind,
} from "@/lib/book-tracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectClass = "h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm";
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const toNumber = (value: string): number | null => (value.trim() === "" || !Number.isFinite(Number(value)) ? null : Math.max(0, Number(value)));
const STATUS_LABELS: Record<BookStatus, string> = { active: "Active", limited: "Limited", closed: "Closed" };

export function BookTracker() {
  const { books, promos, update } = useBookTracker();
  const [newBook, setNewBook] = useState("");
  const available = KNOWN_BOOKS.filter((book) => book.trackable && !books.some((profile) => profile.slug === book.slug));
  const totalBalance = books.reduce((sum, book) => sum + (book.balance ?? 0), 0);
  const expiring = expiringSoon(promos);

  const patchBook = (slug: string, patch: Partial<BookProfile>) =>
    update((state) => ({ ...state, books: state.books.map((book) => (book.slug === slug ? { ...book, ...patch } : book)) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Sportsbook to add" className={selectClass} value={newBook} onChange={(event) => setNewBook(event.target.value)}>
            <option value="">Add a sportsbook</option>
            {available.map((book) => <option key={book.slug} value={book.slug}>{book.name}</option>)}
          </select>
          <Button
            disabled={!newBook}
            onClick={() => {
              update((state) => ({ ...state, books: [...state.books, { slug: newBook, balance: null, maxBet: null, status: "active", notes: "" }] }));
              setNewBook("");
            }}
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
        {books.length > 0 && <p className="text-sm text-muted-foreground">Total balance <span className="font-medium text-foreground tabular-nums">{money(totalBalance)}</span></p>}
      </div>

      {expiring.length > 0 && (
        <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
          <p className="font-medium">Promos expiring soon</p>
          <ul className="mt-1 space-y-0.5">{expiring.map((promo) => <li key={promo.id}>{bookName(promo.bookSlug)}: {promo.title} ({money(promo.amount)}) ends {promo.expiresOn}</li>)}</ul>
        </div>
      )}

      {books.length === 0 ? (
        <p className="rounded-lg border border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
          Add the sportsbooks you use to track balances, bet limits, and promos. The dashboard will cap suggested stakes at each book&apos;s limit and show your open promos.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {books.map((book) => (
            <BookCard
              key={book.slug}
              book={book}
              promos={promos.filter((promo) => promo.bookSlug === book.slug)}
              onPatch={(patch) => patchBook(book.slug, patch)}
              onRemove={() => update((state) => ({ books: state.books.filter((item) => item.slug !== book.slug), promos: state.promos.filter((promo) => promo.bookSlug !== book.slug) }))}
              onAddPromo={(promo) => update((state) => ({ ...state, promos: [...state.promos, promo] }))}
              onPatchPromo={(id, patch) => update((state) => ({ ...state, promos: state.promos.map((promo) => (promo.id === id ? { ...promo, ...patch } : promo)) }))}
              onRemovePromo={(id) => update((state) => ({ ...state, promos: state.promos.filter((promo) => promo.id !== id) }))}
            />
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Stored only in this browser. Clearing site data removes it. Use the <Link href="/promos" className="underline">promo converter</Link> to turn bonuses into guaranteed profit.</p>
    </div>
  );
}

interface BookCardProps {
  book: BookProfile;
  promos: Promo[];
  onPatch: (patch: Partial<BookProfile>) => void;
  onRemove: () => void;
  onAddPromo: (promo: Promo) => void;
  onPatchPromo: (id: string, patch: Partial<Promo>) => void;
  onRemovePromo: (id: string) => void;
}

function BookCard({ book, promos, onPatch, onRemove, onAddPromo, onPatchPromo, onRemovePromo }: BookCardProps) {
  const site = bookSiteUrl(book.slug);
  const name = bookName(book.slug);
  const open = activePromos(promos, book.slug);
  return (
    <section className="space-y-4 rounded-xl border border-border/60 p-4" aria-label={name}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">{site ? <a href={site} target="_blank" rel="noopener noreferrer" className="hover:underline">{name}</a> : name}</h2>
        <Button variant="ghost" size="icon" aria-label={`Remove ${name}`} title={`Remove ${name}`} onClick={onRemove}><Trash2 className="size-4" /></Button>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <label className="space-y-1"><span className="text-muted-foreground">Status</span>
          <select className={`${selectClass} w-full`} value={book.status} onChange={(event) => onPatch({ status: event.target.value as BookStatus })}>
            {BOOK_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
          </select>
        </label>
        <label className="space-y-1"><span className="text-muted-foreground">Balance ($)</span>
          <Input type="number" min={0} step={10} value={book.balance ?? ""} onChange={(event) => onPatch({ balance: toNumber(event.target.value) })} />
        </label>
        {book.status === "limited" && (
          <label className="col-span-2 space-y-1"><span className="text-muted-foreground">Max bet they will take ($)</span>
            <Input type="number" min={0} step={1} value={book.maxBet ?? ""} onChange={(event) => onPatch({ maxBet: toNumber(event.target.value) })} />
          </label>
        )}
        <label className="col-span-2 space-y-1"><span className="text-muted-foreground">Notes</span>
          <Input maxLength={300} value={book.notes} onChange={(event) => onPatch({ notes: event.target.value })} />
        </label>
      </div>
      <div className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Promos ({open.length} open)</h3>
        {promos.length === 0 && <p className="text-sm text-muted-foreground">No promos tracked.</p>}
        <ul className="divide-y divide-border/60">
          {promos.map((promo) => (
            <li key={promo.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span className={promo.used || isPromoExpired(promo) ? "text-muted-foreground line-through" : ""}>
                {promo.title} <span className="text-muted-foreground">({PROMO_LABELS[promo.kind]}, {money(promo.amount)}{promo.expiresOn ? `, ends ${promo.expiresOn}` : ""}{isPromoExpired(promo) ? ", expired" : ""})</span>
              </span>
              <span className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => onPatchPromo(promo.id, { used: !promo.used })}>{promo.used ? "Reopen" : "Mark used"}</Button>
                <Button size="icon" variant="ghost" aria-label={`Delete promo ${promo.title}`} title="Delete promo" onClick={() => onRemovePromo(promo.id)}><Trash2 className="size-4" /></Button>
              </span>
            </li>
          ))}
        </ul>
        <AddPromo bookSlug={book.slug} onAdd={onAddPromo} />
      </div>
    </section>
  );
}

function AddPromo({ bookSlug, onAdd }: { bookSlug: string; onAdd: (promo: Promo) => void }) {
  const [kind, setKind] = useState<PromoKind>("bonus_bet");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const parsedAmount = toNumber(amount);
  return (
    <form
      className="grid grid-cols-2 gap-2 pt-1"
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim() || parsedAmount === null) return;
        onAdd({ id: crypto.randomUUID(), bookSlug, kind, title: title.trim().slice(0, 100), amount: parsedAmount, expiresOn: expiresOn || null, used: false });
        setTitle("");
        setAmount("");
        setExpiresOn("");
      }}
    >
      <select aria-label="Promo type" className={selectClass} value={kind} onChange={(event) => setKind(event.target.value as PromoKind)}>{PROMO_KINDS.map((value) => <option key={value} value={value}>{PROMO_LABELS[value]}</option>)}</select>
      <Input aria-label="Promo title" placeholder="Title" maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} />
      <Input aria-label="Promo value ($)" type="number" min={0} placeholder="Value ($)" value={amount} onChange={(event) => setAmount(event.target.value)} />
      <Input aria-label="Promo expiry date" type="date" value={expiresOn} onChange={(event) => setExpiresOn(event.target.value)} />
      <Button type="submit" variant="outline" className="col-span-2" disabled={!title.trim() || parsedAmount === null}><Plus className="size-4" /> Add promo</Button>
    </form>
  );
}
