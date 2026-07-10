"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, SearchIcon, UserPlusIcon } from "lucide-react";

import { linkCandidateToVacancy } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type LinkableCandidate = {
  id: string;
  name: string;
  city: string | null;
};

export function LinkCandidate({
  vacancyId,
  candidates,
}: {
  vacancyId: string;
  candidates: LinkableCandidate[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [zoek, setZoek] = React.useState("");
  const [bezig, setBezig] = React.useState<string | null>(null);
  const [fout, setFout] = React.useState<string | null>(null);

  const gefilterd = React.useMemo(() => {
    const term = zoek.trim().toLowerCase();
    if (!term) return candidates;
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.city ?? "").toLowerCase().includes(term)
    );
  }, [candidates, zoek]);

  async function koppel(candidateId: string) {
    setBezig(candidateId);
    setFout(null);
    const res = await linkCandidateToVacancy(candidateId, vacancyId);
    setBezig(null);
    if (res?.error) {
      setFout(res.error);
      return;
    }
    setOpen(false);
    setZoek("");
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <UserPlusIcon />
          Kandidaat koppelen
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Kandidaat koppelen</SheetTitle>
          <SheetDescription>
            Kies een kandidaat; die komt in de eerste funnel-fase terecht.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-6">
          {fout && (
            <p role="alert" className="text-sm text-danger-deep">
              {fout}
            </p>
          )}
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              placeholder="Zoeken op naam of woonplaats…"
              className="pl-9"
            />
          </div>

          {candidates.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Alle actieve kandidaten zijn al gekoppeld.
            </p>
          ) : gefilterd.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Geen kandidaten gevonden.
            </p>
          ) : (
            <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
              {gefilterd.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => koppel(c.id)}
                    disabled={bezig !== null}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <span>
                      <span className="font-medium">{c.name}</span>
                      {c.city && (
                        <span className="text-muted-foreground"> · {c.city}</span>
                      )}
                    </span>
                    {bezig === c.id && (
                      <Loader2Icon className="size-4 animate-spin" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
