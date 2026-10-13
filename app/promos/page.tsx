import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/AppHeader";
import { PromoCalculator } from "@/components/dashboard/PromoCalculator";

export const metadata: Metadata = { title: "Promo Converter | SharpLine" };

export default function PromosPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Promo Converter</h1>
          <p className="mt-1 text-sm text-muted-foreground">Turn bonus bets, boosts, risk-free bets, and deposit matches into hedged profit or a clear go/no-go.</p>
        </div>
        <PromoCalculator />
      </main>
    </>
  );
}
