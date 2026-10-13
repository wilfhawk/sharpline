import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/layout/Logo";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Reset password — SharpLine" };

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12 sm:px-6">
      <Link href="/" className="mx-auto">
        <Logo />
      </Link>
      <Card className="flex flex-col gap-4 p-6">
        <div>
          <h1 className="text-lg font-semibold">Set a new password</h1>
        </div>
        <ResetPasswordForm />
      </Card>
    </div>
  );
}
