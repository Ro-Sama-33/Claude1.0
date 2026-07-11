"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListFilterIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const WEERGAVE_OPTIES = [
  { value: "recent", label: "Laatst gesproken (nieuwste eerst)" },
  { value: "oudste", label: "Oudste eerst" },
  { value: "week", label: "Afgelopen week" },
  { value: "maand", label: "Afgelopen maand" },
  { value: "kwartaal", label: "Afgelopen 3 maanden" },
];

export function OverviewToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const huidig = searchParams.get("weergave") ?? "recent";

  function zet(waarde: string) {
    const params = new URLSearchParams(searchParams);
    if (waarde === "recent") params.delete("weergave");
    else params.set("weergave", waarde);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ListFilterIcon className="size-4" aria-hidden />
        Sorteren / periode:
      </span>
      <Select value={huidig} onValueChange={zet}>
        <SelectTrigger aria-label="Sorteren of periode kiezen" className="min-w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WEERGAVE_OPTIES.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
