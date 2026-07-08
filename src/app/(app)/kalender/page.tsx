import type { Metadata } from "next";
import { CalendarIcon } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Kalender",
};

export default function KalenderPage() {
  return (
    <>
      <PageHeader
        title="Kalender"
        description="Alle geplande en geweeste contactmomenten in één maandweergave."
      />

      <EmptyState
        icon={CalendarIcon}
        title="Nog geen contactmomenten"
        description="Vanaf fase 5 zie je hier per maand wie je gesproken hebt en welke afspraken gepland staan."
      />
    </>
  );
}
