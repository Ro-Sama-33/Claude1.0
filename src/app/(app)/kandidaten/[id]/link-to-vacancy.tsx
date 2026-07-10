"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BriefcaseIcon, Loader2Icon } from "lucide-react";

import { linkCandidateToVacancy } from "@/app/(app)/vacatures/actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type LinkableVacancy = { id: string; title: string };

export function LinkToVacancy({
  candidateId,
  vacancies,
}: {
  candidateId: string;
  vacancies: LinkableVacancy[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [bezig, setBezig] = React.useState<string | null>(null);
  const [fout, setFout] = React.useState<string | null>(null);

  async function koppel(vacancyId: string) {
    setBezig(vacancyId);
    setFout(null);
    const res = await linkCandidateToVacancy(candidateId, vacancyId);
    setBezig(null);
    if (res?.error) {
      setFout(res.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <BriefcaseIcon />
          <span className="hidden lg:inline">Koppel aan vacature</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Koppel aan vacature</SheetTitle>
          <SheetDescription>
            De kandidaat komt in de eerste funnel-fase van de gekozen vacature.
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-6">
          {fout && (
            <p role="alert" className="text-sm text-danger-deep">
              {fout}
            </p>
          )}
          {vacancies.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Er zijn geen open vacatures waaraan deze kandidaat nog niet
              gekoppeld is.
            </p>
          ) : (
            <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
              {vacancies.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => koppel(v.id)}
                    disabled={bezig !== null}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <span className="font-medium">{v.title}</span>
                    {bezig === v.id && (
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
