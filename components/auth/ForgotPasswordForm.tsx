"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validation/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  if (!isSupabaseConfigured()) {
    return (
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        Password reset isn&apos;t available yet — this deployment
        hasn&apos;t been connected to a Supabase project.
      </p>
    );
  }

  if (sent) {
    return (
      <p className="rounded-lg border border-border/60 px-4 py-3 text-sm text-muted-foreground">
        If an account exists for that email, a reset link is on its way —
        check your inbox.
      </p>
    );
  }

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsSubmitting(true);
    setServerError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    });

    setIsSubmitting(false);
    if (error) {
      setServerError(error.message);
      return;
    }
    // Always show the same success state regardless of whether the email
    // exists, so this can't be used to enumerate registered accounts.
    setSent(true);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {serverError && <p className="text-xs text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}
