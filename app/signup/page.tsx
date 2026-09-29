import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/layout/Logo";

export default function SignupPage() {
  return (
    <div className="bg-grid bg-glow flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="self-center">
          <Logo />
        </Link>
        <Card className="gap-6 p-6">
          <div>
            <h1 className="text-xl font-semibold">Create your SharpLine account</h1>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline hover:text-foreground">
                Log in
              </Link>
            </p>
          </div>
          <SignupForm />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>
          <GoogleSignInButton />
        </Card>
      </div>
    </div>
  );
}
