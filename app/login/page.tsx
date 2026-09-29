import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/layout/Logo";

export default function LoginPage() {
  return (
    <div className="bg-grid bg-glow flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="self-center">
          <Logo />
        </Link>
        <Card className="gap-6 p-6">
          <div>
            <h1 className="text-xl font-semibold">Log in to SharpLine</h1>
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline hover:text-foreground">
                Sign up
              </Link>
            </p>
          </div>
          <LoginForm />
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
