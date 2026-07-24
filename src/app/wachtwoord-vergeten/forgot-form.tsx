"use client";

import { useActionState } from "react";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";

import { requestPasswordReset, type ResetState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotForm() {
  const [state, formAction, isPending] = useActionState<ResetState, FormData>(
    requestPasswordReset,
    undefined
  );

  if (state?.message) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-success-soft px-3 py-2.5 text-sm text-success-deep">
        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
        {state.message}
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
        <Label htmlFor="email">E-mailadres</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="naam@jumpintopeople.nl"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2Icon className="animate-spin" />}
        Stuur herstel-link
      </Button>
    </form>
  );
}
