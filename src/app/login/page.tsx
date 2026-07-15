import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Inloggen",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            J
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">JIP-ATS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Het recruitmentsysteem van Jump Into People
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Nog geen account?{" "}
          <Link
            href="/aanmelden"
            className="font-medium text-primary hover:underline"
          >
            Toegang aanvragen
          </Link>
        </p>
      </div>
    </div>
  );
}
