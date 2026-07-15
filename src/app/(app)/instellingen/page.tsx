import type { Metadata } from "next";
import { BellRingIcon, PhoneCallIcon, ShieldCheckIcon } from "lucide-react";

import { StageManager, type StageRow } from "./stage-manager";
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
  title: "Instellingen",
};

export default async function InstellingenPage() {
  const supabase = await createClient();

  const [{ data: stageRows }, { data: appRows }] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("id, name, color, position")
      .order("position", { ascending: true }),
    supabase.from("applications").select("stage_id"),
  ]);

  const aantalPerFase = new Map<string, number>();
  for (const app of appRows ?? []) {
    aantalPerFase.set(app.stage_id, (aantalPerFase.get(app.stage_id) ?? 0) + 1);
  }

  const stages: StageRow[] = (stageRows ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    count: aantalPerFase.get(s.id) ?? 0,
  }));

  const stappen = [
    {
      icon: BellRingIcon,
      titel: "Melding",
      tekst:
        "30 dagen vóór het verlopen van de toestemming (elke 365 dagen) verschijnt een melding in de bel, met de beheerder van de kandidaat erbij.",
    },
    {
      icon: PhoneCallIcon,
      titel: "Bellen of mailen",
      tekst:
        "De beheerder neemt zelf contact op met de kandidaat en vraagt of de gegevens bewaard mogen blijven.",
    },
    {
      icon: ShieldCheckIcon,
      titel: "Verlengen of verwijderen",
      tekst:
        'Akkoord? Klik op "Verleng AVG" op het profiel of dashboard (opnieuw 365 dagen). Geen akkoord of geen reactie? Verwijder de kandidaat via het profiel.',
    },
  ];

  return (
    <>
      <PageHeader
        title="Instellingen"
        description="Beheer de funnel-fases en bekijk hoe de AVG-verlenging werkt."
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funnel-fases</CardTitle>
            <CardDescription>
              Fases toevoegen, hernoemen, van kleur voorzien en slepen in de
              gewenste volgorde. Deze funnel geldt voor alle vacatures.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StageManager stages={stages} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AVG-verlenging</CardTitle>
            <CardDescription>
              Verlengen gebeurt handmatig, na persoonlijk contact door de
              beheerder van de kandidaat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-4">
              {stappen.map((stap, i) => (
                <li key={stap.titel} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <stap.icon className="size-4 text-primary" />
                  </span>
                  <div className="text-sm">
                    <p className="font-medium">
                      {i + 1}. {stap.titel}
                    </p>
                    <p className="mt-0.5 text-muted-foreground">{stap.tekst}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
