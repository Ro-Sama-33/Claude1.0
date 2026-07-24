import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { AanmeldForm } from "./aanmeld-form";

export const metadata: Metadata = {
  title: "Toegang aanvragen",
};

export default function AanmeldenPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            J
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Toegang aanvragen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vraag toegang tot JIP-ATS. Een beheerder keurt je aanvraag goed
            voordat je kunt inloggen.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <AanmeldForm />
        </div>

        <p className="mt-6 text-center text-sm">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" />
            Terug naar inloggen
          </Link>
        </p>
      </div>
    </div>
  );
}
