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
  const statusFilter =
    typeof params.status === "string" ? params.status : "actief";
  const avgFilter = typeof params.avg === "string" ? params.avg : "alle";
  const filtersActief =
    q !== "" || plaats !== "" || statusFilter !== "actief" || avgFilter !== "alle";

  const supabase = await createClient();

  let query = supabase
    .from("candidates")
    .select("*, consents(granted_at, expires_at), applications(count)")
    .order("created_at", { ascending: false });

  if (statusFilter === "actief" || statusFilter === "gearchiveerd") {
    query = query.eq("status", statusFilter);
  }
  if (plaats) {
    query = query.eq("city", plaats);
  }
  if (q) {
    const veilig = q.replace(/[%_,()]/g, " ").trim();
    if (veilig) {
      query = query.or(
        `first_name.ilike.%${veilig}%,last_name.ilike.%${veilig}%,email.ilike.%${veilig}%`
      );
    }
  }

  const [{ data: rows }, { data: stedenRows }] = await Promise.all([
    query,
    supabase.from("candidates").select("city").not("city", "is", null),
  ]);

  const kandidaten = (rows ?? []).filter((kandidaat) => {
    if (avgFilter === "alle") return true;
    return avgStatus(kandidaat.consents).status === avgFilter;
  });

  const steden = [
    ...new Set(
      (stedenRows ?? [])
        .map((r) => r.city)
        .filter((c): c is string => !!c && c.trim() !== "")
    ),
  ].sort((a, b) => a.localeCompare(b, "nl"));

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
          <KandidatenToolbar steden={steden} />

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
