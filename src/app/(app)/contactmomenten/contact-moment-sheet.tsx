"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, PhoneIcon } from "lucide-react";

import { addContactMoment, type ContactState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_TYPES, toDatetimeLocal } from "@/lib/contact";

export type PickCandidate = { id: string; name: string };

export function ContactMomentSheet({
  candidateId,
  candidateName,
  candidates,
  defaultDate,
  triggerLabel = "Contactmoment",
  triggerVariant = "outline",
  compactLabel = false,
  hideTrigger = false,
  open: openProp,
  onOpenChange,
}: {
  candidateId?: string;
  candidateName?: string;
  candidates?: PickCandidate[];
  defaultDate?: string; // "YYYY-MM-DD"
  triggerLabel?: string;
  triggerVariant?: "default" | "outline";
  compactLabel?: boolean;
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [state, formAction, isPending] = useActionState<ContactState, FormData>(
    addContactMoment,
    undefined
  );

  React.useEffect(() => {
    if (state?.success) {
      setOpen(false);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fouten = state?.fieldErrors ?? {};

  // Standaard datum/tijd: gekozen kalenderdag om 09:00, anders nu.
  const defaultOccurred = React.useMemo(() => {
    if (defaultDate) return `${defaultDate}T09:00`;
    return toDatetimeLocal(new Date());
  }, [defaultDate]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <SheetTrigger asChild>
          <Button variant={triggerVariant}>
            <PhoneIcon />
            <span className={compactLabel ? "hidden lg:inline" : undefined}>
              {triggerLabel}
            </span>
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Contactmoment vastleggen</SheetTitle>
          <SheetDescription>
            {candidateName
              ? `Voor ${candidateName}. Een moment in de toekomst geldt als gepland.`
              : "Een moment in de toekomst geldt als gepland."}
          </SheetDescription>
        </SheetHeader>

        {/* key reset zorgt dat de velden leeg terugkomen na opslaan */}
        <form
          key={open ? "open" : "closed"}
          action={formAction}
          className="flex flex-col gap-5 px-4 pb-6"
        >
          {state?.error && (
            <div
              role="alert"
              className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger-deep"
            >
              {state.error}
            </div>
          )}

          {candidateId ? (
            <input type="hidden" name="candidate_id" value={candidateId} />
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="candidate_id">
                Kandidaat
                <span aria-hidden className="text-danger">
                  *
                </span>
              </Label>
              <Select name="candidate_id">
                <SelectTrigger
                  id="candidate_id"
                  className="w-full"
                  aria-invalid={!!fouten.candidate_id}
                >
                  <SelectValue placeholder="Kies een kandidaat" />
                </SelectTrigger>
                <SelectContent>
                  {(candidates ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fouten.candidate_id && (
                <p role="alert" className="text-xs text-danger-deep">
                  {fouten.candidate_id}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">Type contact</Label>
            <Select name="type" defaultValue="gebeld">
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="occurred_at">
              Datum en tijd
              <span aria-hidden className="text-danger">
                *
              </span>
            </Label>
            <Input
              id="occurred_at"
              name="occurred_at"
              type="datetime-local"
              defaultValue={defaultOccurred}
              aria-invalid={!!fouten.occurred_at}
              required
            />
            {fouten.occurred_at && (
              <p role="alert" className="text-xs text-danger-deep">
                {fouten.occurred_at}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Notitie</Label>
            <Textarea
              id="note"
              name="note"
              rows={3}
              placeholder="Waar ging het gesprek over?"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="animate-spin" />}
              Vastleggen
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
