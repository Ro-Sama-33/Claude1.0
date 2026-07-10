import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, InfoIcon } from "lucide-react";

import {
  KanbanBoard,
  type KanbanCard,
  type KanbanStage,
} from "./kanban-board";
import { LinkCandidate, type LinkableCandidate } from "./link-candidate";
import { VacancyHeaderActions } from "./vacancy-header-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { avgStatus } from "@/lib/avg";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Vacature",
};

export default async function VacatureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();

  const { data: vacancy } = await supabase
    .from("vacancies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!vacancy) notFound();

  const [{ data: stageRows }, { data: appRows }] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("id, name, color, position")
      .order("position", { ascending: true }),
    supabase
      .from("applications")
      .select(
        "id, stage_id, position, candidate:candidates(id, first_name, last_name, city, last_contact_at, consents(granted_at, expires_at))"
      )
      .eq("vacancy_id", id)
      .order("position", { ascending: true }),
  ]);

  const stages: KanbanStage[] = (stageRows ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }));

  const initialColumns: Record<string, KanbanCard[]> = {};
  for (const stage of stages) initialColumns[stage.id] = [];
  const gekoppeldeIds = new Set<string>();

  for (const app of appRows ?? []) {
    const kandidaat = app.candidate;
    if (!kandidaat) continue;
    gekoppeldeIds.add(kandidaat.id);
    const kolom = initialColumns[app.stage_id];
    if (!kolom) continue; // fase verwijderd? kaart hoort nergens
    kolom.push({
      applicationId: app.id,
      candidateId: kandidaat.id,
      name: `${kandidaat.first_name} ${kandidaat.last_name}`,
      city: kandidaat.city,
      lastContact: kandidaat.last_contact_at,
      avg: avgStatus(kandidaat.consents).status,
    });
  }

  // Actieve kandidaten die nog niet aan deze vacature gekoppeld zijn.
  const { data: alleActief } = await supabase
    .from("candidates")
    .select("id, first_name, last_name, city")
    .eq("status", "actief")
    .order("last_name", { ascending: true });

  const koppelbaar: LinkableCandidate[] = (alleActief ?? [])
    .filter((c) => !gekoppeldeIds.has(c.id))
    .map((c) => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      city: c.city,
    }));

  const totaal = gekoppeldeIds.size;

  return (
    <>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/vacatures">
            <ArrowLeftIcon />
            Alle vacatures
          </Link>
        </Button>
      </div>

      <PageHeader title={vacancy.title}>
        <VacancyHeaderActions vacancy={vacancy} />
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Badge variant={vacancy.status === "open" ? "success" : "secondary"}>
          {vacancy.status === "open" ? "Open" : "Gesloten"}
        </Badge>
        <span>
          {totaal} {totaal === 1 ? "kandidaat" : "kandidaten"} in de funnel
        </span>
        <div className="ml-auto">
          <LinkCandidate vacancyId={vacancy.id} candidates={koppelbaar} />
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed bg-card px-4 py-8 text-sm text-muted-foreground">
          <InfoIcon className="size-4 shrink-0" />
          Er zijn nog geen funnel-fases. Voeg ze toe bij{" "}
          <Link href="/instellingen" className="font-medium text-primary underline">
            Instellingen
          </Link>
          .
        </div>
      ) : (
        <KanbanBoard
          vacancyId={vacancy.id}
          stages={stages}
          initialColumns={initialColumns}
        />
      )}
    </>
  );
}
