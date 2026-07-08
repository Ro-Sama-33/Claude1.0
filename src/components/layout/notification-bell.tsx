"use client";

import { BellIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationBell({ count = 0 }: { count?: number }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon />
          {count > 0 && (
            <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.65rem] font-semibold leading-4 text-white tabular-nums">
              {count > 99 ? "99+" : count}
            </span>
          )}
          <span className="sr-only">
            Notificaties{count > 0 ? ` (${count} ongelezen)` : ""}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaties</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
          Nog geen meldingen. AVG- en contactmeldingen verschijnen hier vanaf
          fase 4.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
