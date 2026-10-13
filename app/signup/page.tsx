import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/layout/Logo";
import { SignupForm } from "@/components/auth/SignupForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Sign up — SharpLine" };

export default async function SignupPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12 sm:px-6">
      <Link href="/" className="mx-auto">
        <Logo />
      </Link>
      <Card className="flex flex-col gap-4 p-6">
        <div>
          <h1 className="text-lg font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Free forever — upgrade any time.
          </p>
        </div>
        <SignupForm />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border/60" />
          or
          <span className="h-px flex-1 bg-border/60" />
        </div>
        <GoogleSignInButton />
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}
