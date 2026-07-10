import type { Metadata } from "next";
import Link from "next/link";
import { PhoneCallIcon } from "lucide-react";

import { ContactMomentSheet } from "./contact-moment-sheet";
import { OverviewToolbar } from "./overview-toolbar";
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
import { contactType } from "@/lib/contact";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Contactmomenten",
};

function sinds(dagen: number) {
  const d = new Date();
  d.setDate(d.getDate() - dagen);
  return d.toISOString();
}

export default async function ContactmomentenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const weergave =
    typeof params.weergave === "string" ? params.weergave : "recent";

  const supabase = await createClient();
  const nu = new Date().toISOString();

  let query = supabase
    .from("contact_moments")
    .select(
      "id, type, occurred_at, note, candidate:candidates(id, first_name, last_name, email, phone, current_role)"
    );

  // Periode-opties tonen alleen momenten uit het verleden binnen het venster.
  if (weergave === "week") {
    query = query.gte("occurred_at", sinds(7)).lte("occurred_at", nu);
  } else if (weergave === "maand") {
    query = query.gte("occurred_at", sinds(30)).lte("occurred_at", nu);
  } else if (weergave === "kwartaal") {
    query = query.gte("occurred_at", sinds(90)).lte("occurred_at", nu);
  }

  query = query.order("occurred_at", { ascending: weergave === "oudste" });

  const [{ data: rows }, { data: kandidaten }] = await Promise.all([
    query,
    supabase
      .from("candidates")
      .select("id, first_name, last_name")
      .eq("status", "actief")
      .order("last_name", { ascending: true }),
  ]);

  const momenten = (rows ?? []).filter((m) => m.candidate);
  const kandidaatOpties = (kandidaten ?? []).map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`,
  }));

  return (
    <>
      <PageHeader
        title="Contactmomenten"
        description="Alle contactmomenten met kandidaten, op één plek."
      >
        <ContactMomentSheet
          candidates={kandidaatOpties}
          triggerLabel="Contactmoment"
          triggerVariant="default"
        />
      </PageHeader>

      <OverviewToolbar />

      {momenten.length === 0 ? (
        <EmptyState
          icon={PhoneCallIcon}
          title="Geen contactmomenten"
          description="Leg een contactmoment vast, koppel het aan een kandidaat en voeg een notitie toe. Het verschijnt hier én op het kandidaatprofiel."
          action={
            <ContactMomentSheet
              candidates={kandidaatOpties}
              triggerLabel="Contactmoment toevoegen"
              triggerVariant="default"
            />
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Kandidaat</TableHead>
                <TableHead>Contactgegevens</TableHead>
                <TableHead>Functie</TableHead>
                <TableHead>Notitie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {momenten.map((m) => {
                const kandidaat = m.candidate!;
                const gepland = new Date(m.occurred_at).getTime() > Date.now();
                const type = contactType(m.type);
                return (
                  <TableRow key={m.id} className="relative">
                    <TableCell className="align-top">
                      <Link
                        href={`/kandidaten/${kandidaat.id}`}
                        className="font-medium after:absolute after:inset-0 hover:underline"
                      >
                        {kandidaat.first_name} {kandidaat.last_name}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: type.color }}
                            aria-hidden
                          />
                          {type.label}
                        </span>
                        <span>{formatDateTime(m.occurred_at)}</span>
                        {gepland && <Badge variant="secondary">Gepland</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{kandidaat.email ?? "—"}</span>
                        {kandidaat.phone && <span>{kandidaat.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-muted-foreground">
                      {kandidaat.current_role ?? "—"}
                    </TableCell>
                    <TableCell className="align-top text-muted-foreground">
                      <span className="line-clamp-2 max-w-xs whitespace-pre-wrap">
                        {m.note ?? "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {momenten.length}{" "}
        {momenten.length === 1 ? "contactmoment" : "contactmomenten"} · klik op
        een kandidaat voor het profiel
      </p>
    </>
  );
}
