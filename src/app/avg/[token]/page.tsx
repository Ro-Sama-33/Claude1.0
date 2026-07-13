import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheckIcon } from "lucide-react";

import { AvgKeuze } from "./avg-keuze";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "AVG-toestemming — Jump Into People",
};

/**
 * Openbare pagina uit de AVG-mail: de kandidaat verlengt hier zonder in te
 * loggen de toestemming, of laat de gegevens verwijderen. De geheime token
 * in de URL is de toegangssleutel; acties lopen via aparte, beperkte
 * databasefuncties.
 */
export default async function AvgPaginaVoorKandidaat({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("avg_pagina", {
    p_token: token,
  });
  const kandidaat = data?.[0] ?? null;

  const ongeldig = !error && !kandidaat;
  const alVerwijderd = kandidaat?.kandidaat_status === "geanonimiseerd";

  return (
    <div className="flex min-h-svh items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheckIcon className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            AVG-toestemming
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Jump Into People
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          {error ? (
            <p className="text-sm text-muted-foreground">
              De pagina kon niet worden geladen. Probeer het over een paar
              minuten opnieuw via de link in de e-mail.
            </p>
          ) : ongeldig ? (
            <p className="text-sm text-muted-foreground">
              Deze link is niet (meer) geldig. Neem contact op met Jump Into
              People als je vragen hebt over je gegevens.
            </p>
          ) : alVerwijderd ? (
            <p className="text-sm text-muted-foreground">
              Je gegevens zijn al uit ons systeem verwijderd. Je hoeft verder
              niets te doen.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="text-sm">
                <p className="font-medium">Beste {kandidaat!.voornaam},</p>
                <p className="mt-2 text-muted-foreground">
                  Wij bewaren je gegevens (cv en contactgegevens) om je te
                  kunnen benaderen voor passende functies.
                  {kandidaat!.einddatum && (
                    <>
                      {" "}
                      Je huidige toestemming is geldig tot{" "}
                      <strong className="text-foreground">
                        {formatDate(kandidaat!.einddatum)}
                      </strong>
                      .
                    </>
                  )}{" "}
                  Kies hieronder wat je wilt. Reageer je niet, dan verwijderen
                  wij je gegevens automatisch 30 dagen na de vervaldatum.
                </p>
              </div>
              <AvgKeuze token={token} />
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Vragen over je gegevens? Reageer op de e-mail die je van ons kreeg.
        </p>
      </div>
    </div>
  );
}
