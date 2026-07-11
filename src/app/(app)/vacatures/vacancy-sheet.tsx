"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2Icon, PencilIcon, PlusIcon } from "lucide-react";

import {
  createVacancy,
  updateVacancy,
  type VacancyFormState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Vacancy } from "@/lib/types";

export function VacancySheet({ vacancy }: { vacancy?: Vacancy }) {
  const [open, setOpen] = React.useState(false);
  const isNieuw = !vacancy;

  const action = React.useMemo(
    () => (vacancy ? updateVacancy.bind(null, vacancy.id) : createVacancy),
    [vacancy]
  );
  const [state, formAction, isPending] = useActionState<
    VacancyFormState,
    FormData
  >(action, undefined);

  React.useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {isNieuw ? (
          <Button>
            <PlusIcon />
            Vacature toevoegen
          </Button>
        ) : (
          <Button variant="outline">
            <PencilIcon />
            Bewerken
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {isNieuw ? "Vacature toevoegen" : "Vacature bewerken"}
          </SheetTitle>
          <SheetDescription>
            {isNieuw
              ? "Alleen de titel is verplicht. Bedrijf en locatie zijn optioneel; kandidaten koppel je erna via het funnel-bord."
              : "Pas de titel, het bedrijf, de locatie of de status aan."}
          </SheetDescription>
        </SheetHeader>
        <form action={formAction} className="flex flex-col gap-5 px-4 pb-6">
          {state?.error && (
            <div
              role="alert"
              className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger-deep"
            >
              {state.error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">
              Titel
              <span aria-hidden className="text-danger">
                *
              </span>
            </Label>
            <Input
              id="title"
              name="title"
              defaultValue={vacancy?.title}
              aria-invalid={!!state?.fieldError}
              placeholder="Bijv. Recruiter (32–40 uur)"
              autoFocus
              required
            />
            {state?.fieldError && (
              <p role="alert" className="text-xs text-danger-deep">
                {state.fieldError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company">Bedrijf</Label>
            <Input
              id="company"
              name="company"
              defaultValue={vacancy?.company ?? ""}
              placeholder="Bijv. Jump Into People"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Locatie</Label>
            <Input
              id="location"
              name="location"
              defaultValue={vacancy?.location ?? ""}
              placeholder="Bijv. Utrecht"
            />
          </div>

          {!isNieuw && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={vacancy.status}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="gesloten">Gesloten</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="animate-spin" />}
              {isNieuw ? "Vacature toevoegen" : "Wijzigingen opslaan"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
