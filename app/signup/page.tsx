import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function SignupPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
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
    </div>
  );
}
