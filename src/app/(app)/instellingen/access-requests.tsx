"use client";

import * as React from "react";
import {
  CheckIcon,
  CopyIcon,
  Loader2Icon,
  MailIcon,
  XIcon,
} from "lucide-react";

import {
  approveRequest,
  rejectRequest,
  type ApproveResult,
} from "./access-actions";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

export type AccessRequestRow = {
  id: string;
  full_name: string;
  email: string;
  note: string | null;
  created_at: string;
};

export function AccessRequests({ requests }: { requests: AccessRequestRow[] }) {
  const [bezigId, setBezigId] = React.useState<string | null>(null);
  const [resultaat, setResultaat] = React.useState<
    (ApproveResult & { id: string }) | null
  >(null);
  const [gekopieerd, setGekopieerd] = React.useState(false);

  async function goedkeuren(id: string) {
    setBezigId(id);
    setResultaat(null);
    const res = await approveRequest(id);
    setResultaat({ ...res, id });
    setBezigId(null);
  }

  async function afwijzen(id: string) {
    setBezigId(id);
    setResultaat(null);
    await rejectRequest(id);
    setBezigId(null);
  }

  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Geen openstaande aanvragen. Nieuwe aanvragen (via de knop &ldquo;Toegang
        aanvragen&rdquo; op de inlogpagina) verschijnen hier.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {resultaat?.tempPassword && (
        <div className="rounded-lg border border-success/40 bg-success-soft p-3 text-sm">
          <p className="font-medium text-success-deep">
            Account aangemaakt voor {resultaat.email}
          </p>
          <p className="mt-1 text-muted-foreground">
            Deel dit tijdelijke wachtwoord met je collega (eenmalig zichtbaar).
            Ze loggen ermee in en wijzigen het via &ldquo;Mijn account&rdquo;.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="rounded bg-background px-2 py-1 font-mono text-sm">
              {resultaat.tempPassword}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(resultaat.tempPassword!);
                setGekopieerd(true);
                setTimeout(() => setGekopieerd(false), 1500);
              }}
            >
              {gekopieerd ? <CheckIcon /> : <CopyIcon />}
              {gekopieerd ? "Gekopieerd" : "Kopieer"}
            </Button>
          </div>
        </div>
      )}
      {resultaat?.error && !resultaat.tempPassword && (
        <p role="alert" className="text-sm text-danger-deep">
          {resultaat.error}
        </p>
      )}

      <ul className="flex flex-col divide-y">
        {requests.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 py-3 first:pt-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{r.full_name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MailIcon className="size-3" />
                  {r.email}
                </p>
                {r.note && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    &ldquo;{r.note}&rdquo;
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Aangevraagd op {formatDateTime(r.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => afwijzen(r.id)}
                  disabled={bezigId === r.id}
                  className="text-danger-deep hover:bg-danger-soft"
                >
                  <XIcon />
                  Afwijzen
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => goedkeuren(r.id)}
                  disabled={bezigId === r.id}
                >
                  {bezigId === r.id ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <CheckIcon />
                  )}
                  Goedkeuren
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
