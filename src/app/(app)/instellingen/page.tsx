import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Instellingen",
};

export default function InstellingenPage() {
  return (
    <>
      <PageHeader
        title="Instellingen"
        description="Beheer de funnel-fases en de AVG-teksten."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funnel-fases</CardTitle>
            <CardDescription>
              Fases toevoegen, hernoemen, van kleur voorzien en slepen in de
              gewenste volgorde.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">Fase 3</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Nog niet beschikbaar. De standaardfunnel start met: Nieuw →
            Gesproken → Voorgesteld → Interview → Aangenomen → Afgewezen.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AVG</CardTitle>
            <CardDescription>
              Teksten van de toestemmingsmelding en (optioneel) de
              verlengingsmail.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">Fase 4</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Nog niet beschikbaar. Toestemming staat straks standaard aan:
            365 dagen geldig, met een melding 30 dagen vóór de einddatum.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
