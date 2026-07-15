"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  Loader2Icon,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "laden" | "klaar" | "ongeldig" | "gelukt";

export default function WachtwoordHerstellenPage() {
  const [status, setStatus] = React.useState<Status>("laden");
  const [fout, setFout] = React.useState<string | null>(null);
  const [bezig, setBezig] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();
    let actief = true;

    // De browser-client wisselt de token uit de mail-link automatisch in voor
    // een herstel-sessie; we wachten tot die er is (of niet komt).
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!actief) return;
      if (event === "PASSWORD_RECOVERY" || session) setStatus("klaar");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!actief) return;
      if (data.session) setStatus("klaar");
      else setTimeout(() => actief && setStatus((s) => (s === "laden" ? "ongeldig" : s)), 1500);
    });

    return () => {
      actief = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function opslaan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement)
      .value;
    setFout(null);

    if (password.length < 8) {
      setFout("Kies een wachtwoord van minimaal 8 tekens.");
      return;
    }
    if (password !== confirm) {
      setFout("De twee wachtwoorden zijn niet gelijk.");
      return;
    }

    setBezig(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBezig(false);
    if (error) {
      setFout("Opslaan is niet gelukt. Vraag eventueel een nieuwe link aan.");
      return;
    }
    await supabase.auth.signOut();
    setStatus("gelukt");
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            J
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nieuw wachtwoord
          </h1>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          {status === "laden" && (
            <p className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Even geduld…
            </p>
          )}

          {status === "ongeldig" && (
            <p className="text-sm text-muted-foreground">
              Deze herstel-link is ongeldig of verlopen. Vraag een nieuwe aan
              via &ldquo;Wachtwoord vergeten&rdquo;.
            </p>
          )}

          {status === "gelukt" && (
            <div className="flex items-start gap-2 text-sm text-success-deep">
              <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
              Je wachtwoord is ingesteld. Je kunt nu inloggen.
            </div>
          )}

          {status === "klaar" && (
            <form onSubmit={opslaan} className="flex flex-col gap-5">
              {fout && (
                <p role="alert" className="text-sm text-danger-deep">
                  {fout}
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
              <Button type="submit" className="w-full" disabled={bezig}>
                {bezig && <Loader2Icon className="animate-spin" />}
                Wachtwoord opslaan
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" />
            Naar inloggen
          </Link>
        </p>
      </div>
    </div>
  );
}
