import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AccountView } from "@/components/account/AccountView";
import { AppHeader } from "@/components/layout/AppHeader";

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <AppHeader />
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8 sm:px-6">
          <h1 className="text-xl font-semibold">Account & Billing</h1>
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Account & billing aren&apos;t available yet — this deployment
            hasn&apos;t been connected to Supabase/Stripe.
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

  const { data: profile } = await supabase
    .from("users")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  return (
    <>
      <AppHeader />
      <AccountView
        email={user.email ?? ""}
        tier={(profile?.subscription_tier as "free" | "plus" | "pro") ?? "free"}
      />
    </>
  );
}
