import type { Metadata } from "next";
import { PlusIcon, UsersIcon } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Kandidaten",
};

export default function KandidatenPage() {
  return (
    <>
      <PageHeader
        title="Kandidaten"
        description="De kandidatendatabase, los van vacatures."
      >
        <Tooltip>
          <TooltipTrigger asChild>
            {/* span nodig: een disabled button vuurt geen tooltip-events af */}
            <span tabIndex={0}>
              <Button disabled>
                <PlusIcon />
                Kandidaat toevoegen
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Beschikbaar vanaf fase 2</TooltipContent>
        </Tooltip>
      </PageHeader>

      <EmptyState
        icon={UsersIcon}
        title="Nog geen kandidaten"
        description="In fase 2 voeg je hier kandidaten toe met contactgegevens, arbeidsvoorwaarden en CV-upload — met zoeken en filteren op naam, woonplaats en status."
      />
    </>
  );
}
