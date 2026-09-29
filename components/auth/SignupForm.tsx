"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signupSchema, type SignupFormValues } from "@/lib/validation/auth";
import { AgeGateModal } from "./AgeGateModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SignupForm() {
  const router = useRouter();
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  if (!isSupabaseConfigured()) {
    return (
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        Sign-up isn&apos;t available yet — this deployment hasn&apos;t been
        connected to a Supabase project. Set{" "}
        <code className="rounded bg-black/20 px-1 py-0.5 text-xs">
          NEXT_PUBLIC_SUPABASE_URL
        </code>{" "}
        and{" "}
        <code className="rounded bg-black/20 px-1 py-0.5 text-xs">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{" "}
        to enable it.
      </p>
    );
  }

  async function handleConfirm() {
    setIsSubmitting(true);
    setServerError(null);

    const { email, password } = getValues();
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setServerError(error.message);
      setIsSubmitting(false);
      setShowAgeGate(false);
      return;
    }

    if (data.user) {
      await supabase
        .from("users")
        .update({
          age_gate_consented_at: new Date().toISOString(),
          jurisdiction_confirmed: true,
        })
        .eq("id", data.user.id);
    }

    setIsSubmitting(false);
    setShowAgeGate(false);

    if (data.session) {
      router.push("/dashboard");
    } else {
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <p className="rounded-lg border border-border/60 px-4 py-3 text-sm text-muted-foreground">
        Check your email to confirm your account, then{" "}
        <Link href="/login" className="underline hover:text-foreground">
          log in
        </Link>
        .
      </p>
    );
  }

  return (
    <>
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(() => setShowAgeGate(true))}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
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
          <Label htmlFor="confirmPassword">Confirm password</Label>
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

        {serverError && (
          <p className="text-xs text-destructive">{serverError}</p>
        )}

        <Button type="submit">Create account</Button>
      </form>

      <AgeGateModal
        open={showAgeGate}
        onOpenChange={setShowAgeGate}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
