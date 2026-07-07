import type { Metadata } from "next";
import { BriefcaseIcon, PlusIcon } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Vacatures",
};

export default function VacaturesPage() {
  return (
    <>
      <PageHeader
        title="Vacatures"
        description="Vacatures met een eigen funnel per vacature."
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <Button disabled>
                <PlusIcon />
                Vacature toevoegen
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Beschikbaar vanaf fase 3</TooltipContent>
        </Tooltip>
      </PageHeader>

      <EmptyState
        icon={BriefcaseIcon}
        title="Nog geen vacatures"
        description="In fase 3 maak je hier vacatures aan en sleep je kandidaten via een kanban-bord door de zelf ingestelde funnel-fases."
      />
    </>
  );
}
