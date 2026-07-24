import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { ResetForm } from "./reset-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nieuw wachtwoord",
};

export default async function WachtwoordHerstellenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
          {user ? (
            <ResetForm />
          ) : (
            <p className="text-sm text-muted-foreground">
              Deze herstel-link is ongeldig of verlopen. Vraag een nieuwe aan
              via &ldquo;Wachtwoord vergeten&rdquo;.
            </p>
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
