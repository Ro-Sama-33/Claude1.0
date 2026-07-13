"use client";

import * as React from "react";
import { CheckCircle2Icon, Loader2Icon, Trash2Icon } from "lucide-react";

import {
  verlengToestemming,
  verwijderGegevens,
  type AvgKeuzeState,
} from "./actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/** De twee keuzeknoppen op de openbare AVG-pagina. */
export function AvgKeuze({ token }: { token: string }) {
  const [bezig, setBezig] = React.useState(false);
  const [resultaat, setResultaat] = React.useState<AvgKeuzeState>();

  async function verleng() {
    setBezig(true);
    setResultaat(await verlengToestemming(token));
    setBezig(false);
  }

  async function verwijder() {
    setBezig(true);
    setResultaat(await verwijderGegevens(token));
    setBezig(false);
  }

  if (resultaat?.verlengd) {
    return (
      <div className="flex items-start gap-3 rounded-lg bg-success-soft p-4 text-sm text-success-deep">
        <CheckCircle2Icon className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium">Dank je wel!</p>
          <p className="mt-1">
            Je toestemming is verlengd en is nu geldig tot{" "}
            <strong>{resultaat.verlengd}</strong>. Je hoeft verder niets te
            doen.
          </p>
        </div>
      </div>
    );
  }

  if (resultaat?.verwijderd) {
    return (
      <div className="flex items-start gap-3 rounded-lg bg-muted p-4 text-sm">
        <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium">Je gegevens zijn verwijderd.</p>
          <p className="mt-1 text-muted-foreground">
            Alle persoonsgegevens (naam, contactgegevens, cv en notities) zijn
            uit ons systeem gewist. Deze link werkt nu niet meer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {resultaat?.error && (
        <p
          role="alert"
          className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger-deep"
        >
          {resultaat.error}
        </p>
      )}

      <Button onClick={verleng} disabled={bezig} size="lg" className="w-full">
        {bezig && <Loader2Icon className="animate-spin" />}
        Ja, bewaar mijn gegevens (365 dagen verlengen)
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            disabled={bezig}
            className="w-full text-danger-deep hover:bg-danger-soft"
          >
            <Trash2Icon />
            Nee, verwijder mijn gegevens
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gegevens definitief verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Je naam, contactgegevens, cv en alle notities worden direct en
              definitief uit het systeem gewist. Dit kan niet ongedaan worden
              gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={verwijder}>
              Ja, verwijder mijn gegevens
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
