import type { Metadata } from "next";

import { ChangePasswordForm } from "./change-password-form";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mijn account",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profiel } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <>
      <PageHeader
        title="Mijn account"
        description="Je persoonlijke gegevens en wachtwoord."
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gegevens</CardTitle>
            <CardDescription>
              Je naam wordt getoond bij notities, contactmomenten en als
              beheerder van kandidaten. Neem contact op met de beheerder om je
              naam te laten aanpassen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y text-sm">
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-muted-foreground">Naam</dt>
                <dd className="font-medium">
                  {profiel?.full_name?.trim() || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-muted-foreground">E-mailadres</dt>
                <dd className="font-medium">{user?.email ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wachtwoord wijzigen</CardTitle>
            <CardDescription>
              Kies een nieuw wachtwoord van minimaal 8 tekens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
