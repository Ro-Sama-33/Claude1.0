import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  CircleAlertIcon,
  DownloadIcon,
  FileTextIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { NotesSection, type NoteView } from "./notes-section";
import { ProfileActions } from "./profile-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { avgBadge, avgStatus } from "@/lib/avg";
import { formatDate, formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Kandidaat",
};

function GegevensRij({
  label,
  waarde,
}: {
  label: string;
  waarde: string | number | null;
}) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">
        {waarde === null || waarde === "" ? "—" : waarde}
      </dd>
    </div>
  );
}

export default async function KandidaatProfielPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const zoekParams = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: kandidaat } = await supabase
    .from("candidates")
    .select(
      "*, consents(id, granted_at, expires_at, method, status), candidate_notes(id, body, created_at, updated_at, created_by, author:profiles(full_name)), applications(id, vacancy:vacancies(id, title, status), stage:pipeline_stages(name, color))"
    )
    .eq("id", id)
    .maybeSingle();

  if (!kandidaat) notFound();

  // Gekoppelde vacatures (nieuwste eerst) + open vacatures waaraan nog niet
  // gekoppeld, voor de "Koppel aan vacature"-actie.
  const koppelingen = [...kandidaat.applications].filter((a) => a.vacancy);
  const gekoppeldeVacatureIds = new Set(
    koppelingen.map((a) => a.vacancy!.id)
  );
  const { data: openVacatures } = await supabase
    .from("vacancies")
    .select("id, title")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  const linkableVacancies = (openVacatures ?? []).filter(
    (v) => !gekoppeldeVacatureIds.has(v.id)
  );

  const avg = avgStatus(kandidaat.consents);
  const badge = avgBadge[avg.status];
  const notities = ([...kandidaat.candidate_notes] as NoteView[]).sort(
    (a, b) => (a.created_at < b.created_at ? 1 : -1)
  );
  const consents = [...kandidaat.consents].sort((a, b) =>
    a.granted_at < b.granted_at ? 1 : -1
  );

  let cvUrl: string | null = null;
  let cvIsPdf = false;
  let cvNaam: string | null = null;
  if (kandidaat.cv_path) {
    cvIsPdf = kandidaat.cv_path.toLowerCase().endsWith(".pdf");
    cvNaam = (kandidaat.cv_path.split("/").pop() ?? "CV").replace(/^\d+_/, "");
    const { data: signed } = await supabase.storage
      .from("cvs")
      .createSignedUrl(kandidaat.cv_path, 3600, {
        download: cvIsPdf ? undefined : cvNaam,
      });
    cvUrl = signed?.signedUrl ?? null;
  }

  return (
    <>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/kandidaten">
            <ArrowLeftIcon />
            Alle kandidaten
          </Link>
        </Button>
      </div>

      {zoekParams.cv_fout === "1" && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2.5 text-sm text-warning-deep"
        >
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
          De kandidaat is opgeslagen, maar het CV kon niet worden geüpload.
          Probeer het opnieuw via Bewerken.
        </div>
      )}

      {kandidaat.status === "gearchiveerd" && (
        <div className="mb-4 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
          Deze kandidaat is gearchiveerd. Via het menu rechtsboven zet je hem
          terug naar actief.
        </div>
      )}

      {kandidaat.status === "geanonimiseerd" && (
        <div className="mb-4 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
          Deze kandidaat is geanonimiseerd. De persoonsgegevens zijn verwijderd;
          alleen een AVG-audittrail blijft bewaard.
        </div>
      )}

      {kandidaat.status === "actief" && avg.status === "verlopen" && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger-deep"
        >
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
          De AVG-toestemming is verlopen. Verleng de toestemming, of anonimiseer
          of verwijder de kandidaat via de acties rechtsboven.
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {kandidaat.first_name} {kandidaat.last_name}
            </h1>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {kandidaat.city && (
              <span className="inline-flex items-center gap-1">
                <MapPinIcon className="size-3.5" />
                {kandidaat.city}
              </span>
            )}
            <span>
              Laatst gesproken: {formatDate(kandidaat.last_contact_at)}
            </span>
            {avg.expiresAt && (
              <span>AVG geldig tot {formatDate(avg.expiresAt)}</span>
            )}
          </p>
        </div>
        <ProfileActions
          candidate={kandidaat}
          linkableVacancies={linkableVacancies}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <div className="flex flex-col gap-4">
          <Card className="gap-3 py-5">
            <CardHeader>
              <CardTitle>Contactgegevens</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y text-sm">
                <GegevensRij label="E-mail" waarde={kandidaat.email} />
                <GegevensRij label="Telefoon" waarde={kandidaat.phone} />
                <GegevensRij label="Woonplaats" waarde={kandidaat.city} />
                <GegevensRij
                  label="Huidige functie"
                  waarde={kandidaat.current_role}
                />
                <GegevensRij label="Bron" waarde={kandidaat.source} />
              </dl>
            </CardContent>
          </Card>

          <Card className="gap-3 py-5">
            <CardHeader>
              <CardTitle>Arbeidsvoorwaarden</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y text-sm">
                <GegevensRij
                  label="Salarisindicatie"
                  waarde={kandidaat.salary_indication}
                />
                <GegevensRij
                  label="Uren per week"
                  waarde={kandidaat.hours_per_week}
                />
                <GegevensRij
                  label="Contractvoorkeur"
                  waarde={kandidaat.contract_preference}
                />
                <GegevensRij
                  label="Beschikbaarheid"
                  waarde={kandidaat.availability}
                />
              </dl>
            </CardContent>
          </Card>

          <Card className="gap-3 py-5">
            <CardHeader>
              <CardTitle>Gekoppelde vacatures</CardTitle>
            </CardHeader>
            <CardContent>
              {koppelingen.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nog geen gekoppelde vacatures. Gebruik &ldquo;Koppel aan
                  vacature&rdquo; hierboven.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {koppelingen.map((app) => (
                    <li
                      key={app.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <Link
                        href={`/vacatures/${app.vacancy!.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {app.vacancy!.title}
                        {app.vacancy!.status === "gesloten" && (
                          <span className="text-muted-foreground">
                            {" "}
                            (gesloten)
                          </span>
                        )}
                      </Link>
                      {app.stage && (
                        <Badge
                          variant="outline"
                          className="shrink-0 gap-1.5"
                          style={{ borderColor: app.stage.color }}
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: app.stage.color }}
                            aria-hidden
                          />
                          {app.stage.name}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cv">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="cv">CV</TabsTrigger>
            <TabsTrigger value="notities">
              Notities{notities.length > 0 ? ` (${notities.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="tijdlijn">Tijdlijn</TabsTrigger>
          </TabsList>

          <TabsContent value="cv">
            {!kandidaat.cv_path ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-16 text-center">
                <FileTextIcon className="mb-3 size-6 text-muted-foreground" />
                <p className="font-medium">Nog geen CV geüpload</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload een PDF- of Word-bestand via Bewerken.
                </p>
              </div>
            ) : !cvUrl ? (
              <div className="rounded-lg border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
                Het CV kon niet worden geladen. Vernieuw de pagina om het
                opnieuw te proberen.
              </div>
            ) : cvIsPdf ? (
              <div className="overflow-hidden rounded-lg border bg-card">
                <iframe
                  src={cvUrl}
                  title={`CV van ${kandidaat.first_name} ${kandidaat.last_name}`}
                  className="h-[75vh] w-full"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border bg-card px-6 py-16 text-center">
                <FileTextIcon className="mb-3 size-6 text-muted-foreground" />
                <p className="font-medium">{cvNaam}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Word-bestanden zijn niet inline te bekijken.
                </p>
                <Button asChild className="mt-4">
                  <a href={cvUrl}>
                    <DownloadIcon />
                    CV downloaden
                  </a>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notities">
            <NotesSection
              candidateId={kandidaat.id}
              notes={notities}
              currentUserId={user?.id ?? ""}
            />
          </TabsContent>

          <TabsContent value="tijdlijn">
            <div className="rounded-lg border bg-card p-4">
              <ul className="flex flex-col gap-3">
                {consents.map((consent) => (
                  <li key={consent.id} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-success-soft">
                      <ShieldCheckIcon className="size-3.5 text-success-deep" />
                    </span>
                    <div className="text-sm">
                      <p className="font-medium">
                        AVG-toestemming vastgelegd ({consent.method.toLowerCase()})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(consent.granted_at)} · geldig tot{" "}
                        {formatDate(consent.expires_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                Contactmomenten verschijnen hier vanaf fase 5.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
