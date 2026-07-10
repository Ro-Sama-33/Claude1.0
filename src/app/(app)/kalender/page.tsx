import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { CalendarBoard, type CalendarMoment } from "./calendar-board";
import { PageHeader } from "@/components/layout/page-header";
import { ContactMomentSheet } from "@/app/(app)/contactmomenten/contact-moment-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  monthGridRange,
  monthLabel,
  parseMonthParam,
  shiftMonth,
} from "@/lib/calendar";
import { contactType } from "@/lib/contact";
import { formatDate, formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Kalender",
};

export default async function KalenderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const maandParam = typeof params.maand === "string" ? params.maand : undefined;
  const { year, month } = parseMonthParam(maandParam);
  const { start, end } = monthGridRange(year, month);

  const supabase = await createClient();
  const nu = new Date().toISOString();
  const drieMaanden = new Date();
  drieMaanden.setMonth(drieMaanden.getMonth() - 3);

  const [{ data: momentRows }, { data: kandidaten }, { data: gepland }, { data: aandacht }] =
    await Promise.all([
      supabase
        .from("contact_moments")
        .select(
          "id, type, occurred_at, candidate:candidates(id, first_name, last_name)"
        )
        .gte("occurred_at", start.toISOString())
        .lt("occurred_at", end.toISOString()),
      supabase
        .from("candidates")
        .select("id, first_name, last_name")
        .eq("status", "actief")
        .order("last_name", { ascending: true }),
      supabase
        .from("contact_moments")
        .select(
          "id, type, occurred_at, candidate:candidates(id, first_name, last_name)"
        )
        .gt("occurred_at", nu)
        .order("occurred_at", { ascending: true })
        .limit(6),
      supabase
        .from("candidates")
        .select("id, first_name, last_name, last_contact_at")
        .eq("status", "actief")
        .not("last_contact_at", "is", null)
        .lt("last_contact_at", drieMaanden.toISOString())
        .order("last_contact_at", { ascending: true })
        .limit(6),
    ]);

  const moments: CalendarMoment[] = (momentRows ?? [])
    .filter((m) => m.candidate)
    .map((m) => ({
      id: m.id,
      occurredAt: m.occurred_at,
      type: m.type,
      candidateId: m.candidate!.id,
      candidateName: `${m.candidate!.first_name} ${m.candidate!.last_name}`,
    }));

  const kandidaatOpties = (kandidaten ?? []).map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`,
  }));

  const huidigeMaand = `${year}-${String(month + 1).padStart(2, "0")}`;

  return (
    <>
      <PageHeader
        title="Kalender"
        description="Geplande en geweeste contactmomenten in één maandoverzicht."
      >
        <ContactMomentSheet
          candidates={kandidaatOpties}
          triggerLabel="Contactmoment"
          triggerVariant="default"
        />
      </PageHeader>

      <div className="mb-4 flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link
            href={`/kalender?maand=${shiftMonth(year, month, -1)}`}
            aria-label="Vorige maand"
          >
            <ChevronLeftIcon />
          </Link>
        </Button>
        <Button variant="outline" size="icon" asChild>
          <Link
            href={`/kalender?maand=${shiftMonth(year, month, 1)}`}
            aria-label="Volgende maand"
          >
            <ChevronRightIcon />
          </Link>
        </Button>
        <h2 className="ml-1 text-lg font-semibold capitalize">
          {monthLabel(year, month)}
        </h2>
        <Button variant="ghost" size="sm" asChild className="ml-auto">
          <Link href="/kalender">Vandaag</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <CalendarBoard
          key={huidigeMaand}
          year={year}
          month={month}
          moments={moments}
          candidates={kandidaatOpties}
        />

        <div className="flex flex-col gap-4">
          <Card className="gap-3 py-5">
            <CardHeader>
              <CardTitle className="text-base">Komende momenten</CardTitle>
            </CardHeader>
            <CardContent>
              {(gepland ?? []).filter((m) => m.candidate).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Geen geplande contactmomenten.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {(gepland ?? [])
                    .filter((m) => m.candidate)
                    .map((m) => (
                      <li key={m.id} className="flex items-start gap-2">
                        <span
                          className="mt-1 size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: contactType(m.type).color }}
                          aria-hidden
                        />
                        <div className="min-w-0 text-sm">
                          <Link
                            href={`/kandidaten/${m.candidate!.id}`}
                            className="font-medium hover:underline"
                          >
                            {m.candidate!.first_name} {m.candidate!.last_name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {contactType(m.type).label} ·{" "}
                            {formatDateTime(m.occurred_at)}
                          </p>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="gap-3 py-5">
            <CardHeader>
              <CardTitle className="text-base">Aandacht nodig</CardTitle>
            </CardHeader>
            <CardContent>
              {(aandacht ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Iedereen is recent gesproken.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {(aandacht ?? []).map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <Link
                        href={`/kandidaten/${c.id}`}
                        className="min-w-0 text-sm font-medium hover:underline"
                      >
                        <span className="block truncate">
                          {c.first_name} {c.last_name}
                        </span>
                      </Link>
                      <Badge variant="warning" className="shrink-0">
                        {formatDate(c.last_contact_at)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
