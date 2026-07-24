"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIES = [
  { value: "actief", label: "Actief" },
  { value: "gearchiveerd", label: "Gearchiveerd" },
  { value: "alle", label: "Alle statussen" },
];

export type VacatureOptie = { id: string; title: string };

export function KandidatenToolbar({
  steden,
  functies,
  vacatures,
}: {
  steden: string[];
  functies: string[];
  vacatures: VacatureOptie[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [zoekterm, setZoekterm] = React.useState(searchParams.get("q") ?? "");

  const zetParam = React.useCallback(
    (naam: string, waarde: string, standaard: string) => {
      const params = new URLSearchParams(searchParams);
      if (waarde === standaard) params.delete(naam);
      else params.set(naam, waarde);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Zoeken met korte debounce zodat niet elke toetsaanslag een request is.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (zoekterm !== (searchParams.get("q") ?? "")) {
        zetParam("q", zoekterm.trim(), "");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [zoekterm, searchParams, zetParam]);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1 sm:max-w-xs">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          placeholder="Zoeken op naam of e-mail…"
          className="pl-9"
          aria-label="Zoeken op naam of e-mail"
        />
      </div>

      <Select
        value={searchParams.get("plaats") ?? "alle"}
        onValueChange={(v) => zetParam("plaats", v, "alle")}
      >
        <SelectTrigger aria-label="Filter op woonplaats">
          <SelectValue placeholder="Woonplaats" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alle">Alle woonplaatsen</SelectItem>
          {steden.map((stad) => (
            <SelectItem key={stad} value={stad}>
              {stad}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("functie") ?? "alle"}
        onValueChange={(v) => zetParam("functie", v, "alle")}
      >
        <SelectTrigger aria-label="Filter op functie">
          <SelectValue placeholder="Functie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alle">Alle functies</SelectItem>
          {functies.map((functie) => (
            <SelectItem key={functie} value={functie}>
              {functie}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("vacature") ?? "alle"}
        onValueChange={(v) => zetParam("vacature", v, "alle")}
      >
        <SelectTrigger aria-label="Filter op vacature">
          <SelectValue placeholder="Vacature" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alle">Alle vacatures</SelectItem>
          {vacatures.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("status") ?? "actief"}
        onValueChange={(v) => zetParam("status", v, "actief")}
      >
        <SelectTrigger aria-label="Filter op status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIES.map((optie) => (
            <SelectItem key={optie.value} value={optie.value}>
              {optie.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
