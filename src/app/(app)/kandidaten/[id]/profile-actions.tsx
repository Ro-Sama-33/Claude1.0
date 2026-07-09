"use client";

import * as React from "react";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  MoreVerticalIcon,
  PhoneIcon,
  UserXIcon,
  Trash2Icon,
} from "lucide-react";

import {
  anonymizeCandidate,
  deleteCandidate,
  setCandidateStatus,
} from "../actions";
import { CandidateSheet } from "../candidate-sheet";
import { LinkToVacancy, type LinkableVacancy } from "./link-to-vacancy";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Candidate } from "@/lib/types";

function UitgesteldeActie({
  icon: Icon,
  label,
  fase,
}: {
  icon: typeof PhoneIcon;
  label: string;
  fase: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>
          <Button variant="outline" disabled>
            <Icon />
            <span className="hidden lg:inline">{label}</span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Beschikbaar vanaf {fase}</TooltipContent>
    </Tooltip>
  );
}

export function ProfileActions({
  candidate,
  linkableVacancies,
}: {
  candidate: Candidate;
  linkableVacancies: LinkableVacancy[];
}) {
  const [verwijderOpen, setVerwijderOpen] = React.useState(false);
  const [archiveerOpen, setArchiveerOpen] = React.useState(false);
  const [anonimiseerOpen, setAnonimiseerOpen] = React.useState(false);
  const isGearchiveerd = candidate.status === "gearchiveerd";
  const isGeanonimiseerd = candidate.status === "geanonimiseerd";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isGeanonimiseerd && (
        <>
          <CandidateSheet candidate={candidate} />
          <UitgesteldeActie
            icon={PhoneIcon}
            label="Contactmoment"
            fase="fase 5"
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
              <DropdownMenuItem onSelect={() => setAnonimiseerOpen(true)}>
                <UserXIcon />
                Anonimiseren
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

      <AlertDialog open={anonimiseerOpen} onOpenChange={setAnonimiseerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kandidaat anonimiseren?</AlertDialogTitle>
            <AlertDialogDescription>
              De persoonsgegevens van {candidate.first_name}{" "}
              {candidate.last_name} worden overschreven met
              &ldquo;[verwijderd]&rdquo;, het CV en de notities worden gewist en
              koppelingen met vacatures verdwijnen. De kandidaat blijft als
              geanonimiseerd record bestaan (AVG-audit). Dit kan niet ongedaan
              worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => anonymizeCandidate(candidate.id)}
            >
              Anonimiseren
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
