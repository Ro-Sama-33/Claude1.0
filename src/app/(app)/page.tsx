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
import { ContactMomentSheet } from "@/app/(app)/contactmomenten/contact-moment-sheet";
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

  const drieMaanden = new Date();
  drieMaanden.setMonth(drieMaanden.getMonth() - 3);

  const [
    { count: actieveKandidaten },
    { count: openVacatures },
    { data: actieveConsents },
    { data: geenContact },
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
      .select(
        "id, first_name, last_name, owner:profiles(full_name), consents(granted_at, expires_at)"
      )
      .eq("status", "actief"),
    supabase
      .from("candidates")
      .select("id, first_name, last_name, last_contact_at")
      .eq("status", "actief")
      .not("last_contact_at", "is", null)
      .lt("last_contact_at", drieMaanden.toISOString())
      .order("last_contact_at", { ascending: true })
      .limit(8),
  ]);

  const avgActies = (actieveConsents ?? [])
    .map((kandidaat) => ({
      id: kandidaat.id,
      naam: `${kandidaat.first_name} ${kandidaat.last_name}`,
      beheerder: kandidaat.owner?.full_name?.trim() || null,
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

  const contactReminders = geenContact ?? [];

  const stats = [
    {
      label: "Actieve kandidaten",
      value: actieveKandidaten ?? 0,
      icon: UsersIcon,
      href: "/kandidaten",
    },
    {
      label: "Open vacatures",
      value: openVacatures ?? 0,
      icon: BriefcaseIcon,
      href: "/vacatures",
    },
    {
      label: "AVG-acties",
      value: avgActies.length,
      icon: ShieldCheckIcon,
      href: "/kandidaten",
    },
    {
      label: "Contact-reminders",
      value: contactReminders.length,
      icon: BellRingIcon,
      href: "/contactmomenten",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overzicht van kandidaten, vacatures en acties die aandacht vragen."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Card className="gap-2 py-5 transition-colors hover:border-ring">
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
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AVG-acties nodig</CardTitle>
            <CardDescription>
              Kandidaten van wie de toestemming binnenkort verloopt of al
              verlopen is. Bel of mail de kandidaat en verleng na akkoord.
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
                        {k.beheerder && ` · bel/mail door ${k.beheerder}`}
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
            {contactReminders.length === 0 ? (
              <EmptyState
                icon={BellRingIcon}
                title="Geen contact-reminders"
                description="Iedereen die je hebt gesproken, is binnen 3 maanden gesproken. Leg contactmomenten vast om dit bij te houden."
              />
            ) : (
              <ul className="flex flex-col divide-y">
                {contactReminders.map((k) => (
                  <li
                    key={k.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/kandidaten/${k.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {k.first_name} {k.last_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Laatst gesproken op {formatDate(k.last_contact_at)}
                      </p>
                    </div>
                    <ContactMomentSheet
                      candidateId={k.id}
                      candidateName={`${k.first_name} ${k.last_name}`}
                      triggerLabel="Plan"
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
