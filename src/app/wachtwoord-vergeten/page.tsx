import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Wachtwoord vergeten",
};

export default function WachtwoordVergetenPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            J
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Wachtwoord vergeten
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vul je e-mailadres in; je krijgt een link om een nieuw wachtwoord
            in te stellen.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <ForgotForm />
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
