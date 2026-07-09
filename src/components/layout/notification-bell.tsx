"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BellIcon, CheckIcon, ShieldAlertIcon, ClockIcon } from "lucide-react";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/(app)/notifications/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/format";
import type { NotificationType } from "@/lib/types";
import { cn } from "@/lib/utils";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  message: string;
  candidateId: string | null;
  candidateName: string | null;
  createdAt: string;
};

const ICON: Record<NotificationType, typeof ShieldAlertIcon> = {
  avg_verloopt: ClockIcon,
  avg_verlopen: ShieldAlertIcon,
  geen_contact_3m: ClockIcon,
};

export function NotificationBell({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const count = notifications.length;

  function openCandidate(item: NotificationItem) {
    void markNotificationRead(item.id);
    setOpen(false);
    if (item.candidateId) router.push(`/kandidaten/${item.candidateId}`);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
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
      <DropdownMenuContent align="end" className="w-88 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium">Notificaties</span>
          {count > 0 && (
            <button
              type="button"
              onClick={() => markAllNotificationsRead()}
              className="text-xs text-primary hover:underline"
            >
              Alles gelezen
            </button>
          )}
        </div>
        <div className="border-t" />
        {count === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            Geen openstaande meldingen.
          </div>
        ) : (
          <ul className="max-h-96 overflow-y-auto py-1">
            {notifications.map((item) => {
              const Icon = ICON[item.type];
              const isVerlopen = item.type === "avg_verlopen";
              return (
                <li key={item.id} className="flex items-start gap-1 px-1">
                  <button
                    type="button"
                    onClick={() => openCandidate(item)}
                    className="flex flex-1 items-start gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                        isVerlopen
                          ? "bg-danger-soft text-danger-deep"
                          : "bg-warning-soft text-warning-deep"
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0">
                      {item.candidateName && (
                        <span className="block text-sm font-medium">
                          {item.candidateName}
                        </span>
                      )}
                      <span className="block text-xs text-muted-foreground">
                        {item.message}
                      </span>
                      <span className="mt-0.5 block text-[0.68rem] text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => markNotificationRead(item.id)}
                    aria-label="Melding afvinken"
                    className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <CheckIcon className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
