import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon } from "lucide-react";

import { VacancySheet } from "./vacancy-sheet";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Vacatures",
};

export default async function VacaturesPage() {
  const supabase = await createClient();

  const { data: vacancies } = await supabase
    .from("vacancies")
    .select("*, applications(count)")
    .order("created_at", { ascending: false });

  const rijen = vacancies ?? [];

  return (
    <>
      <PageHeader
        title="Vacatures"
        description="Vacatures met een eigen funnel per vacature."
      >
        <VacancySheet />
      </PageHeader>

      {rijen.length === 0 ? (
        <EmptyState
          icon={BriefcaseIcon}
          title="Nog geen vacatures"
          description="Maak een vacature aan — alleen de titel is verplicht — en koppel er daarna kandidaten aan via het kanban-bord."
          action={<VacancySheet />}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Titel</TableHead>
                <TableHead>Bedrijf</TableHead>
                <TableHead>Locatie</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Kandidaten</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rijen.map((vacancy) => {
                const aantal =
                  (vacancy.applications as { count: number }[])[0]?.count ?? 0;
                return (
                  <TableRow key={vacancy.id} className="relative cursor-pointer">
                    <TableCell className="font-medium">
                      <Link
                        href={`/vacatures/${vacancy.id}`}
                        className="after:absolute after:inset-0"
                      >
                        {vacancy.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {vacancy.company ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {vacancy.location ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          vacancy.status === "open" ? "success" : "secondary"
                        }
                      >
                        {vacancy.status === "open" ? "Open" : "Gesloten"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {aantal}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
