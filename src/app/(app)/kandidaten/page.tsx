import type { Metadata } from "next";
import Link from "next/link";
import { SearchXIcon, UsersIcon } from "lucide-react";

import { CandidateSheet } from "./candidate-sheet";
import { KandidatenToolbar } from "./toolbar";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { avgBadge, avgStatus } from "@/lib/avg";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Kandidaten",
};

export default async function KandidatenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const plaats = typeof params.plaats === "string" ? params.plaats : "";
  const functie = typeof params.functie === "string" ? params.functie : "";
  const vacature = typeof params.vacature === "string" ? params.vacature : "";
  const statusFilter =
    typeof params.status === "string" ? params.status : "actief";
  const filtersActief =
    q !== "" ||
    plaats !== "" ||
    functie !== "" ||
    vacature !== "" ||
    statusFilter !== "actief";

  const supabase = await createClient();

  // Vacaturefilter: eerst de gekoppelde kandidaat-id's ophalen.
  let vacatureKandidaatIds: string[] | null = null;
  if (vacature) {
    const { data: apps } = await supabase
      .from("applications")
      .select("candidate_id")
      .eq("vacancy_id", vacature);
    vacatureKandidaatIds = (apps ?? []).map((a) => a.candidate_id);
    // Geldige nil-UUID als sentinel: matcht niets, maar voorkomt een
    // uuid-castfout bij een lege .in()-lijst.
    if (vacatureKandidaatIds.length === 0) {
      vacatureKandidaatIds = ["00000000-0000-0000-0000-000000000000"];
    }
  }

  let query = supabase
    .from("candidates")
    .select("*, consents(granted_at, expires_at), applications(count)")
    .order("created_at", { ascending: false });

  if (statusFilter === "actief" || statusFilter === "gearchiveerd") {
    query = query.eq("status", statusFilter);
  }
  if (plaats) query = query.eq("city", plaats);
  if (functie) query = query.eq("current_role", functie);
  if (vacatureKandidaatIds) query = query.in("id", vacatureKandidaatIds);
  if (q) {
    const veilig = q.replace(/[%_,()]/g, " ").trim();
    if (veilig) {
      query = query.or(
        `first_name.ilike.%${veilig}%,last_name.ilike.%${veilig}%,email.ilike.%${veilig}%`
      );
    }
  }

  const [{ data: rows }, { data: filterRows }, { data: vacatureRows }] =
    await Promise.all([
      query,
      supabase
        .from("candidates")
        .select("city, current_role")
        .eq("status", "actief"),
      supabase
        .from("vacancies")
        .select("id, title")
        .order("created_at", { ascending: false }),
    ]);

  const kandidaten = rows ?? [];

  const steden = [
    ...new Set(
      (filterRows ?? [])
        .map((r) => r.city)
        .filter((c): c is string => !!c && c.trim() !== "")
    ),
  ].sort((a, b) => a.localeCompare(b, "nl"));

  const functies = [
    ...new Set(
      (filterRows ?? [])
        .map((r) => r.current_role)
        .filter((c): c is string => !!c && c.trim() !== "")
    ),
  ].sort((a, b) => a.localeCompare(b, "nl"));

  const vacatures = vacatureRows ?? [];

  const databaseLeeg = (rows ?? []).length === 0 && !filtersActief;

  return (
    <>
      <PageHeader
        title="Kandidaten"
        description="De kandidatendatabase, los van vacatures."
      >
        <CandidateSheet />
      </PageHeader>

      {databaseLeeg ? (
        <EmptyState
          icon={UsersIcon}
          title="Nog geen kandidaten"
          description="Voeg de eerste kandidaat toe met contactgegevens, arbeidsvoorwaarden, AVG-toestemming en CV."
          action={<CandidateSheet />}
        />
      ) : (
        <>
          <KandidatenToolbar
            steden={steden}
            functies={functies}
            vacatures={vacatures}
          />

          {kandidaten.length === 0 ? (
            <EmptyState
              icon={SearchXIcon}
              title="Geen kandidaten gevonden"
              description="Er zijn geen kandidaten die aan deze zoekopdracht en filters voldoen."
              action={
                <Button variant="outline" asChild>
                  <Link href="/kandidaten">Filters wissen</Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Naam</TableHead>
                    <TableHead>Woonplaats</TableHead>
                    <TableHead>Huidige functie</TableHead>
                    <TableHead>Laatst gesproken</TableHead>
                    <TableHead>AVG</TableHead>
                    <TableHead>Vacatures</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kandidaten.map((kandidaat) => {
                    const avg = avgStatus(kandidaat.consents);
                    const badge = avgBadge[avg.status];
                    return (
                      <TableRow
                        key={kandidaat.id}
                        className="relative cursor-pointer"
                      >
                        <TableCell className="font-medium">
                          <Link
                            href={`/kandidaten/${kandidaat.id}`}
                            className="after:absolute after:inset-0"
                          >
                            {kandidaat.first_name} {kandidaat.last_name}
                          </Link>
                          {kandidaat.status === "gearchiveerd" && (
                            <Badge variant="secondary" className="ml-2">
                              Gearchiveerd
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {kandidaat.city ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {kandidaat.current_role ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(kandidaat.last_contact_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {(kandidaat.applications as { count: number }[])[0]
                            ?.count || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            {kandidaten.length}{" "}
            {kandidaten.length === 1 ? "kandidaat" : "kandidaten"}
            {filtersActief ? " (gefilterd)" : ""} · laatst gesproken volgt in
            fase 5
          </p>
        </>
      )}
    </>
  );
}
