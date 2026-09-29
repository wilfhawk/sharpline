import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
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
    </div>
  );
}
