"use client";

import * as React from "react";
import { LockIcon, MoreVerticalIcon, UnlockIcon, Trash2Icon } from "lucide-react";

import { deleteVacancy, setVacancyStatus } from "../actions";
import { VacancySheet } from "../vacancy-sheet";
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
import type { Vacancy } from "@/lib/types";

export function VacancyHeaderActions({ vacancy }: { vacancy: Vacancy }) {
  const [verwijderOpen, setVerwijderOpen] = React.useState(false);
  const isOpen = vacancy.status === "open";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <VacancySheet vacancy={vacancy} />
      <Button
        variant="outline"
        onClick={() =>
          setVacancyStatus(vacancy.id, isOpen ? "gesloten" : "open")
        }
      >
        {isOpen ? <LockIcon /> : <UnlockIcon />}
        <span className="hidden sm:inline">
          {isOpen ? "Sluiten" : "Heropenen"}
        </span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVerticalIcon />
            <span className="sr-only">Meer acties</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setVerwijderOpen(true)}
          >
            <Trash2Icon />
            Vacature verwijderen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={verwijderOpen} onOpenChange={setVerwijderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vacature verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{vacancy.title}&rdquo; en alle koppelingen met kandidaten
              worden verwijderd. De kandidaten zelf blijven bestaan. Dit kan niet
              ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteVacancy(vacancy.id)}
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
