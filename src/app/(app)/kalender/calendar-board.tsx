"use client";

import * as React from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import {
  ContactMomentSheet,
  type PickCandidate,
} from "@/app/(app)/contactmomenten/contact-moment-sheet";
import { buildMonthGrid, dayKey, WEEKDAGEN } from "@/lib/calendar";
import { contactType } from "@/lib/contact";
import type { ContactType } from "@/lib/contact";
import { cn } from "@/lib/utils";

export type CalendarMoment = {
  id: string;
  occurredAt: string;
  type: ContactType;
  candidateId: string;
  candidateName: string;
};

export function CalendarBoard({
  year,
  month,
  moments,
  candidates,
}: {
  year: number;
  month: number;
  moments: CalendarMoment[];
  candidates: PickCandidate[];
}) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetDate, setSheetDate] = React.useState<string | undefined>();

  const grid = React.useMemo(() => buildMonthGrid(year, month), [year, month]);
  const vandaagKey = dayKey(new Date());

  // Momenten groeperen op lokale dag.
  const perDag = React.useMemo(() => {
    const map = new Map<string, CalendarMoment[]>();
    for (const m of moments) {
      const key = dayKey(new Date(m.occurredAt));
      const arr = map.get(key);
      if (arr) arr.push(m);
      else map.set(key, [m]);
    }
    return map;
  }, [moments]);

  function openVoor(date: Date) {
    setSheetDate(dayKey(date));
    setSheetOpen(true);
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {WEEKDAGEN.map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((date) => {
            const key = dayKey(date);
            const inMaand = date.getMonth() === month;
            const isVandaag = key === vandaagKey;
            const dagMomenten = perDag.get(key) ?? [];
            return (
              <div
                key={key}
                className={cn(
                  "group min-h-24 border-b border-r p-1.5 [&:nth-child(7n)]:border-r-0",
                  !inMaand && "bg-muted/30 text-muted-foreground"
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                      isVandaag && "bg-primary font-semibold text-primary-foreground"
                    )}
                  >
                    {date.getDate()}
                  </span>
                  <button
                    type="button"
                    onClick={() => openVoor(date)}
                    aria-label={`Contactmoment toevoegen op ${date.toLocaleDateString("nl-NL")}`}
                    className="flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <PlusIcon className="size-4" />
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {dagMomenten.slice(0, 3).map((m) => (
                    <Link
                      key={m.id}
                      href={`/kandidaten/${m.candidateId}`}
                      title={`${contactType(m.type).label} · ${m.candidateName}`}
                      className="flex items-center gap-1.5 rounded px-1 py-0.5 text-xs hover:bg-muted"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: contactType(m.type).color }}
                        aria-hidden
                      />
                      <span className="truncate">{m.candidateName}</span>
                    </Link>
                  ))}
                  {dagMomenten.length > 3 && (
                    <span className="px-1 text-[0.68rem] text-muted-foreground">
                      +{dagMomenten.length - 3} meer
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Eén gedeeld sheet, geopend vanaf de gekozen dag. */}
      <ContactMomentSheet
        candidates={candidates}
        defaultDate={sheetDate}
        hideTrigger
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
