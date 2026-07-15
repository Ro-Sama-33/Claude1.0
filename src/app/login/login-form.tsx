"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CircleAlertIcon, Loader2Icon } from "lucide-react";

import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger-deep"
        >
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </div>
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Wachtwoord</Label>
          <Link
            href="/wachtwoord-vergeten"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Wachtwoord vergeten?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2Icon className="animate-spin" />}
        Inloggen
      </Button>
    </form>
  );
}
