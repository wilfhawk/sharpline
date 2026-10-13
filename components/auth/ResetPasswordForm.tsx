"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validation/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    createClient()
      .auth.getUser()
      .then(({ data }) => setHasSession(Boolean(data.user)));
  }, []);

  if (!isSupabaseConfigured()) {
    return (
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        Password reset isn&apos;t available yet — this deployment
        hasn&apos;t been connected to a Supabase project.
      </p>
    );
  }

  if (hasSession === false) {
    return (
      <p className="rounded-lg border border-border/60 px-4 py-3 text-sm text-muted-foreground">
        This reset link is invalid or has expired.{" "}
        <Link href="/forgot-password" className="underline hover:text-foreground">
          Request a new one
        </Link>
        .
      </p>
    );
  }

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsSubmitting(true);
    setServerError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setServerError(error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success("Password updated — you're signed in.");
    router.push("/dashboard");
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {serverError && <p className="text-xs text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting || hasSession === null}>
        {isSubmitting ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
