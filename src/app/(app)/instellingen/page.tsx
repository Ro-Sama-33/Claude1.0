import type { Metadata } from "next";

import { AvgEmailSettings } from "./avg-email-settings";
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

const AVG_FALLBACK = {
  subject: "Verlenging AVG-toestemming",
  body: "",
};

export default async function InstellingenPage() {
  const supabase = await createClient();

  const [{ data: stageRows }, { data: appRows }, { data: settings }] =
    await Promise.all([
      supabase
        .from("pipeline_stages")
        .select("id, name, color, position")
        .order("position", { ascending: true }),
      supabase.from("applications").select("stage_id"),
      supabase
        .from("app_settings")
        .select("avg_email_subject, avg_email_body")
        .eq("id", true)
        .maybeSingle(),
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
        description="Beheer de funnel-fases en de AVG-mail."
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
            <CardTitle className="text-lg">AVG-mail</CardTitle>
            <CardDescription>
              De algemene mail die kandidaten krijgen wanneer hun toestemming
              binnen 30 dagen verloopt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvgEmailSettings
              subject={settings?.avg_email_subject ?? AVG_FALLBACK.subject}
              body={settings?.avg_email_body ?? AVG_FALLBACK.body}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
