"use client";

import * as React from "react";
import { useActionState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";

import {
  createCandidate,
  updateCandidate,
  type CandidateFormState,
} from "./actions";
import { CandidateForm } from "./candidate-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Candidate } from "@/lib/types";

/** Sheet met het kandidaatformulier, voor toevoegen én bewerken. */
export function CandidateSheet({ candidate }: { candidate?: Candidate }) {
  const [open, setOpen] = React.useState(false);
  const isNieuw = !candidate;

  const action = React.useMemo(
    () =>
      candidate
        ? updateCandidate.bind(null, candidate.id)
        : createCandidate,
    [candidate]
  );
  const [state, formAction, isPending] = useActionState<
    CandidateFormState,
    FormData
  >(action, undefined);

  // Bij bewerken sluit de sheet zodra het opslaan is gelukt
  // (toevoegen redirect naar het nieuwe profiel).
  React.useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {isNieuw ? (
          <Button>
            <PlusIcon />
            Kandidaat toevoegen
          </Button>
        ) : (
          <Button variant="outline">
            <PencilIcon />
            Bewerken
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {isNieuw ? "Kandidaat toevoegen" : "Kandidaat bewerken"}
          </SheetTitle>
          <SheetDescription>
            {isNieuw
              ? "Velden met een * zijn verplicht. AVG-toestemming wordt direct vastgelegd en geldt 365 dagen."
              : "Pas de gegevens aan en sla op."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <CandidateForm
            state={state}
            formAction={formAction}
            isPending={isPending}
            candidate={candidate}
            submitLabel={isNieuw ? "Kandidaat toevoegen" : "Wijzigingen opslaan"}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
