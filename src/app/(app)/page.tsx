import type { Metadata } from "next";
import Link from "next/link";
import {
  BellRingIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { RenewAvgButton } from "@/components/avg/renew-avg-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { avgStatus } from "@/lib/avg";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: actieveKandidaten },
    { count: openVacatures },
    { data: actieveConsents },
  ] = await Promise.all([
    supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .eq("status", "actief"),
    supabase
      .from("vacancies")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("candidates")
      .select("id, first_name, last_name, consents(granted_at, expires_at)")
      .eq("status", "actief"),
  ]);

  const avgActies = (actieveConsents ?? [])
    .map((kandidaat) => ({
      id: kandidaat.id,
      naam: `${kandidaat.first_name} ${kandidaat.last_name}`,
      ...avgStatus(kandidaat.consents),
    }))
    .filter(
      (k) => k.status === "verloopt_binnenkort" || k.status === "verlopen"
    )
    // Verlopen eerst, daarna op einddatum (dichtstbijzijnde bovenaan)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "verlopen" ? -1 : 1;
      return (a.expiresAt?.getTime() ?? 0) - (b.expiresAt?.getTime() ?? 0);
    });

  const stats = [
    { label: "Actieve kandidaten", value: actieveKandidaten ?? 0, icon: UsersIcon },
    { label: "Open vacatures", value: openVacatures ?? 0, icon: BriefcaseIcon },
    { label: "AVG-acties", value: avgActies.length, icon: ShieldCheckIcon },
    { label: "Contact-reminders", value: 0, icon: BellRingIcon },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overzicht van kandidaten, vacatures en acties die aandacht vragen."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="gap-2 py-5">
            <CardHeader>
              <CardDescription className="text-[0.78rem] font-medium">
                {stat.label}
              </CardDescription>
              <CardAction>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AVG-acties nodig</CardTitle>
            <CardDescription>
              Kandidaten van wie de toestemming binnenkort verloopt of al
              verlopen is.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {avgActies.length === 0 ? (
              <EmptyState
                icon={ShieldCheckIcon}
                title="Geen AVG-acties"
                description="Alle actieve kandidaten hebben een geldige toestemming. Je krijgt 30 dagen vóór de einddatum een melding."
              />
            ) : (
              <ul className="flex flex-col divide-y">
                {avgActies.map((k) => (
                  <li
                    key={k.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/kandidaten/${k.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {k.naam}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {k.status === "verlopen"
                          ? `Verlopen op ${formatDate(k.expiresAt)}`
                          : `Verloopt op ${formatDate(k.expiresAt)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        variant={k.status === "verlopen" ? "danger" : "warning"}
                      >
                        {k.status === "verlopen" ? "Verlopen" : "Binnenkort"}
                      </Badge>
                      <RenewAvgButton
                        candidateId={k.id}
                        size="sm"
                        label="Verleng"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Langer dan 3 maanden geen contact
            </CardTitle>
            <CardDescription>
              Kandidaten die je te lang niet gesproken hebt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={BellRingIcon}
              title="Geen contact-reminders"
              description="Vanaf fase 5 houdt JIP-ATS bij wanneer je iedere kandidaat voor het laatst sprak."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
