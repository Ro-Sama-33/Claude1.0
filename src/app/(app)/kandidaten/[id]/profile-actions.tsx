"use client";

import * as React from "react";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  MoreVerticalIcon,
  Trash2Icon,
} from "lucide-react";

import { deleteCandidate, setCandidateStatus } from "../actions";
import { CandidateSheet } from "../candidate-sheet";
import { LinkToVacancy, type LinkableVacancy } from "./link-to-vacancy";
import { ContactMomentSheet } from "@/app/(app)/contactmomenten/contact-moment-sheet";
import { RenewAvgButton } from "@/components/avg/renew-avg-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Candidate } from "@/lib/types";

export function ProfileActions({
  candidate,
  linkableVacancies,
}: {
  candidate: Candidate;
  linkableVacancies: LinkableVacancy[];
}) {
  const [verwijderOpen, setVerwijderOpen] = React.useState(false);
  const [archiveerOpen, setArchiveerOpen] = React.useState(false);
  const isGearchiveerd = candidate.status === "gearchiveerd";
  const isGeanonimiseerd = candidate.status === "geanonimiseerd";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isGeanonimiseerd && (
        <>
          <CandidateSheet candidate={candidate} />
          <ContactMomentSheet
            candidateId={candidate.id}
            candidateName={`${candidate.first_name} ${candidate.last_name}`}
            compactLabel
          />
          <LinkToVacancy
            candidateId={candidate.id}
            vacancies={linkableVacancies}
          />
          <RenewAvgButton candidateId={candidate.id} compactLabel />
        </>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVerticalIcon />
            <span className="sr-only">Meer acties</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isGeanonimiseerd && (
            <>
              <DropdownMenuItem onSelect={() => setArchiveerOpen(true)}>
                {isGearchiveerd ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
                {isGearchiveerd ? "Terugzetten naar actief" : "Archiveren"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setVerwijderOpen(true)}
          >
            <Trash2Icon />
            Verwijderen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={archiveerOpen} onOpenChange={setArchiveerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isGearchiveerd
                ? "Kandidaat terugzetten naar actief?"
                : "Kandidaat archiveren?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isGearchiveerd
                ? `${candidate.first_name} ${candidate.last_name} wordt weer zichtbaar in het actieve overzicht.`
                : `${candidate.first_name} ${candidate.last_name} verdwijnt uit het actieve overzicht, maar alle gegevens blijven bewaard.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                setCandidateStatus(
                  candidate.id,
                  isGearchiveerd ? "actief" : "gearchiveerd"
                )
              }
            >
              {isGearchiveerd ? "Terugzetten" : "Archiveren"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={verwijderOpen} onOpenChange={setVerwijderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kandidaat definitief verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Alle gegevens van {candidate.first_name} {candidate.last_name}{" "}
              worden verwijderd: profiel, notities, AVG-records en het CV. Dit
              kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteCandidate(candidate.id)}
            >
              Definitief verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
