import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AppHeader } from "@/components/layout/AppHeader";
import { MyBets } from "@/components/bets/MyBets";

export default async function BetsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <AppHeader />
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8 sm:px-6">
          <h1 className="text-xl font-semibold">My Bets</h1>
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Bet tracking isn&apos;t available yet — this deployment hasn&apos;t
            been connected to Supabase.
          </p>
        </div>
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <AppHeader />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-xl font-semibold">My Bets</h1>
          <p className="text-sm text-muted-foreground">
            Track Closing Line Value (CLV) — the single best predictor of
            long-run betting profitability.
          </p>
        </div>
        <MyBets />
      </div>
    </>
  );
}
