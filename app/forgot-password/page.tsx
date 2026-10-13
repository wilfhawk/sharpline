import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/layout/Logo";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Forgot password — SharpLine" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12 sm:px-6">
      <Link href="/" className="mx-auto">
        <Logo />
      </Link>
      <Card className="flex flex-col gap-4 p-6">
        <div>
          <h1 className="text-lg font-semibold">Reset your password</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ll email you a link to set a new one.
          </p>
        </div>
        <ForgotPasswordForm />
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
