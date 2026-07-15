"use client";

import * as React from "react";
import { useActionState } from "react";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";

import { changePassword, type ChangePasswordState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState<
    ChangePasswordState,
    FormData
  >(changePassword, undefined);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <p role="alert" className="text-sm text-danger-deep">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-sm text-success-deep">
          <CheckCircle2Icon className="size-4" />
          {state.success}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">Herhaal nieuw wachtwoord</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2Icon className="animate-spin" />}
          Wachtwoord wijzigen
        </Button>
      </div>
    </form>
  );
}
