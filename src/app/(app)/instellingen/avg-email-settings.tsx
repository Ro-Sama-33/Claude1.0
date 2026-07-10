"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2Icon, MailIcon, SendIcon } from "lucide-react";

import {
  sendAvgReminders,
  updateAvgEmail,
  type AvgEmailState,
} from "./avg-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AvgEmailSettings({
  subject,
  body,
}: {
  subject: string;
  body: string;
}) {
  const [state, formAction, isPending] = useActionState<AvgEmailState, FormData>(
    updateAvgEmail,
    undefined
  );

  const [verstuurState, setVerstuurState] = React.useState<AvgEmailState>();
  const [verstuurBezig, setVerstuurBezig] = React.useState(false);

  async function verstuur() {
    setVerstuurBezig(true);
    setVerstuurState(undefined);
    const res = await sendAvgReminders();
    setVerstuurState(res);
    setVerstuurBezig(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        {state?.error && (
          <p role="alert" className="text-sm text-danger-deep">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-sm text-success-deep">{state.success}</p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="subject">Onderwerp</Label>
          <Input id="subject" name="subject" defaultValue={subject} required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="body">Mailtekst</Label>
          <Textarea
            id="body"
            name="body"
            defaultValue={body}
            rows={10}
            required
          />
          <p className="text-xs text-muted-foreground">
            Gebruik <code>{"{{naam}}"}</code> en <code>{"{{einddatum}}"}</code>{" "}
            als plaatshouders; die worden per kandidaat ingevuld.
          </p>
        </div>

        <div>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2Icon className="animate-spin" />}
            Mailtekst opslaan
          </Button>
        </div>
      </form>

      <div className="rounded-lg border bg-muted/40 p-3">
        <div className="flex items-start gap-2">
          <MailIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Nu versturen</p>
            <p className="text-xs text-muted-foreground">
              Stuurt deze mail naar iedereen van wie de toestemming binnen 30
              dagen verloopt.
            </p>
            {verstuurState?.error && (
              <p role="alert" className="mt-2 text-xs text-danger-deep">
                {verstuurState.error}
              </p>
            )}
            {verstuurState?.success && (
              <p className="mt-2 text-xs text-success-deep">
                {verstuurState.success}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={verstuur}
            disabled={verstuurBezig}
          >
            {verstuurBezig ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <SendIcon />
            )}
            Versturen
          </Button>
        </div>
      </div>
    </div>
  );
}
