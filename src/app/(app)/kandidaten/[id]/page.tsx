import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  CircleAlertIcon,
  DownloadIcon,
  FileTextIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from "lucide-react";

import {
  ApplicationStageControl,
  type StageOptie,
} from "./application-stage-control";
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
import { contactType, type ContactType } from "@/lib/contact";
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
      "*, consents(id, granted_at, expires_at, method, status), candidate_notes(id, body, created_at, updated_at, created_by, author:profiles(full_name)), applications(id, stage_id, vacancy:vacancies(id, title, status)), contact_moments(id, type, occurred_at, note, author:profiles(full_name))"
    )
    .eq("id", id)
    .maybeSingle();

  if (!kandidaat) notFound();

  // Gekoppelde vacatures (nieuwste eerst) + open vacatures waaraan nog niet
  // gekoppeld, voor de "Koppel aan vacature"-actie. Fases voor het
  // fase-keuzemenu per koppeling.
  const koppelingen = [...kandidaat.applications].filter((a) => a.vacancy);
  const gekoppeldeVacatureIds = new Set(
    koppelingen.map((a) => a.vacancy!.id)
  );
  const [{ data: openVacatures }, { data: stageRows }] = await Promise.all([
    supabase
      .from("vacancies")
      .select("id, title")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
    supabase
      .from("pipeline_stages")
      .select("id, name, color")
      .order("position", { ascending: true }),
  ]);
  const linkableVacancies = (openVacatures ?? []).filter(
    (v) => !gekoppeldeVacatureIds.has(v.id)
  );
  const fases: StageOptie[] = stageRows ?? [];

  const avg = avgStatus(kandidaat.consents);
  const badge = avgBadge[avg.status];
  const notities = ([...kandidaat.candidate_notes] as NoteView[]).sort(
    (a, b) => (a.created_at < b.created_at ? 1 : -1)
  );

  // Gecombineerde tijdlijn: contactmomenten + AVG-gebeurtenissen, nieuwste eerst.
  const nu = Date.now();
  type TimelineEvent =
    | {
        kind: "contact";
        at: string;
        contactType: ContactType;
        note: string | null;
        author: string | null;
        planned: boolean;
      }
    | { kind: "avg"; at: string; method: string; expiresAt: string };
  const tijdlijn: TimelineEvent[] = [
    ...kandidaat.contact_moments.map((m) => ({
      kind: "contact" as const,
      at: m.occurred_at,
      contactType: m.type,
      note: m.note,
      author: m.author?.full_name?.trim() || null,
      planned: new Date(m.occurred_at).getTime() > nu,
    })),
    ...kandidaat.consents.map((c) => ({
      kind: "avg" as const,
      at: c.granted_at,
      method: c.method,
      expiresAt: c.expires_at,
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

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
              <CardTitle>Gekoppelde vacatures</CardTitle>
            </CardHeader>
            <CardContent>
              {koppelingen.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nog geen gekoppelde vacatures. Gebruik &ldquo;Koppel aan
                  vacature&rdquo; hierboven.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {koppelingen.map((app) => (
                    <li
                      key={app.id}
                      className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3"
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
                      <ApplicationStageControl
                        applicationId={app.id}
                        vacancyId={app.vacancy!.id}
                        candidateId={kandidaat.id}
                        stageId={app.stage_id}
                        stages={fases}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

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
              {tijdlijn.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nog geen gebeurtenissen.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {tijdlijn.map((event, i) =>
                    event.kind === "contact" ? (
                      <li key={`c-${i}`} className="flex items-start gap-3">
                        <span
                          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: `${contactType(event.contactType).color}1a`,
                          }}
                        >
                          <PhoneIcon
                            className="size-3.5"
                            style={{ color: contactType(event.contactType).color }}
                          />
                        </span>
                        <div className="min-w-0 text-sm">
                          <p className="flex flex-wrap items-center gap-2 font-medium">
                            {contactType(event.contactType).label}
                            {event.planned && (
                              <Badge variant="secondary">Gepland</Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(event.at)}
                            {event.author ? ` · ${event.author}` : ""}
                          </p>
                          {event.note && (
                            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                              {event.note}
                            </p>
                          )}
                        </div>
                      </li>
                    ) : (
                      <li key={`a-${i}`} className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-success-soft">
                          <ShieldCheckIcon className="size-3.5 text-success-deep" />
                        </span>
                        <div className="text-sm">
                          <p className="font-medium">
                            AVG-toestemming vastgelegd (
                            {event.method.toLowerCase()})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(event.at)} · geldig tot{" "}
                            {formatDate(event.expiresAt)}
                          </p>
                        </div>
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
