import type { Metadata } from "next";
import {
  BellRingIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
};

const stats = [
  { label: "Actieve kandidaten", value: 0, icon: UsersIcon },
  { label: "Open vacatures", value: 0, icon: BriefcaseIcon },
  { label: "AVG-acties", value: 0, icon: ShieldCheckIcon },
  { label: "Contact-reminders", value: 0, icon: BellRingIcon },
];

export default function DashboardPage() {
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
            <EmptyState
              icon={ShieldCheckIcon}
              title="Geen AVG-acties"
              description="Zodra er kandidaten zijn (fase 2) en de AVG-automatisering draait (fase 4), zie je hier wie aandacht nodig heeft."
            />
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
