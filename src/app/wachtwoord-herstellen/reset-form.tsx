"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";

import { updatePassword, type HerstelState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetForm() {
  const [state, formAction, isPending] = useActionState<HerstelState, FormData>(
    updatePassword,
    undefined
  );

  if (state?.success) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2 text-sm text-success-deep">
          <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
          Je wachtwoord is ingesteld. Je kunt nu inloggen.
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Naar inloggen</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.error && (
        <p role="alert" className="text-sm text-danger-deep">
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Nieuw wachtwoord</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Herhaal wachtwoord</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2Icon className="animate-spin" />}
        Wachtwoord opslaan
      </Button>
    </form>
  );
}
