import type { Metadata } from "next";

import { StageManager, type StageRow } from "./stage-manager";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
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

  return (
    <>
      <PageHeader
        title="Instellingen"
        description="Beheer de funnel-fases en de AVG-teksten."
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
            <CardTitle className="text-lg">AVG</CardTitle>
            <CardDescription>
              Teksten van de toestemmingsmelding en (optioneel) de
              verlengingsmail.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">Fase 4</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Nog niet beschikbaar. Toestemming staat straks standaard aan:
            365 dagen geldig, met een melding 30 dagen vóór de einddatum.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
