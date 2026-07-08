"use client";

import * as React from "react";
import { FileTextIcon, Loader2Icon, UploadIcon } from "lucide-react";

import type { CandidateFormState } from "./actions";
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
import { Separator } from "@/components/ui/separator";
import type { Candidate } from "@/lib/types";
import { cn } from "@/lib/utils";

export const CONTRACT_OPTIES = [
  "Vast",
  "Tijdelijk",
  "ZZP / freelance",
  "Geen voorkeur",
];

export const TOESTEMMING_OPTIES = [
  "Telefonisch",
  "Per e-mail",
  "Via formulier",
  "Anders",
];

function Veld({
  label,
  htmlFor,
  error,
  verplicht,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  verplicht?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {verplicht && (
          <span aria-hidden className="text-danger">
            *
          </span>
        )}
      </Label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-danger-deep">
          {error}
        </p>
      )}
    </div>
  );
}

function Sectie({
  titel,
  children,
}: {
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 text-sm font-semibold">{titel}</legend>
      {children}
    </fieldset>
  );
}

export function CandidateForm({
  state,
  formAction,
  isPending,
  candidate,
  submitLabel,
}: {
  state: CandidateFormState;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  candidate?: Candidate;
  submitLabel: string;
}) {
  const fouten = state?.fieldErrors ?? {};
  const isNieuw = !candidate;
  const [cvNaam, setCvNaam] = React.useState<string | null>(null);
  const cvInputRef = React.useRef<HTMLInputElement>(null);

  const huidigCv = candidate?.cv_path
    ? (candidate.cv_path.split("/").pop() ?? "CV").replace(/^\d+_/, "")
    : null;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <div
          role="alert"
          className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger-deep"
        >
          {state.error}
        </div>
      )}

      <Sectie titel="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Veld
            label="Voornaam"
            htmlFor="first_name"
            verplicht
            error={fouten.first_name}
          >
            <Input
              id="first_name"
              name="first_name"
              defaultValue={candidate?.first_name}
              aria-invalid={!!fouten.first_name}
              required
            />
          </Veld>
          <Veld
            label="Achternaam"
            htmlFor="last_name"
            verplicht
            error={fouten.last_name}
          >
            <Input
              id="last_name"
              name="last_name"
              defaultValue={candidate?.last_name}
              aria-invalid={!!fouten.last_name}
              required
            />
          </Veld>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Veld label="E-mailadres" htmlFor="email" error={fouten.email}>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={candidate?.email ?? ""}
              aria-invalid={!!fouten.email}
            />
          </Veld>
          <Veld label="Telefoon" htmlFor="phone" error={fouten.phone}>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={candidate?.phone ?? ""}
            />
          </Veld>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Veld label="Woonplaats" htmlFor="city" error={fouten.city}>
            <Input
              id="city"
              name="city"
              defaultValue={candidate?.city ?? ""}
            />
          </Veld>
          <Veld
            label="Huidige functie"
            htmlFor="current_role"
            error={fouten.current_role}
          >
            <Input
              id="current_role"
              name="current_role"
              defaultValue={candidate?.current_role ?? ""}
            />
          </Veld>
        </div>
        <Veld
          label="Bron (waar komt de kandidaat vandaan?)"
          htmlFor="source"
          error={fouten.source}
        >
          <Input
            id="source"
            name="source"
            defaultValue={candidate?.source ?? ""}
            placeholder="Bijv. LinkedIn, referral, eigen netwerk"
          />
        </Veld>
      </Sectie>

      <Separator />

      <Sectie titel="Arbeidsvoorwaarden">
        <div className="grid gap-4 sm:grid-cols-2">
          <Veld
            label="Salarisindicatie"
            htmlFor="salary_indication"
            error={fouten.salary_indication}
          >
            <Input
              id="salary_indication"
              name="salary_indication"
              defaultValue={candidate?.salary_indication ?? ""}
              placeholder="Bijv. € 3.500 – € 4.000"
            />
          </Veld>
          <Veld
            label="Uren per week"
            htmlFor="hours_per_week"
            error={fouten.hours_per_week}
          >
            <Input
              id="hours_per_week"
              name="hours_per_week"
              inputMode="numeric"
              defaultValue={candidate?.hours_per_week ?? ""}
              aria-invalid={!!fouten.hours_per_week}
            />
          </Veld>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Veld
            label="Contractvoorkeur"
            htmlFor="contract_preference"
            error={fouten.contract_preference}
          >
            <Select
              name="contract_preference"
              defaultValue={candidate?.contract_preference ?? undefined}
            >
              <SelectTrigger id="contract_preference" className="w-full">
                <SelectValue placeholder="Maak een keuze" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_OPTIES.map((optie) => (
                  <SelectItem key={optie} value={optie}>
                    {optie}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Veld>
          <Veld
            label="Beschikbaarheid"
            htmlFor="availability"
            error={fouten.availability}
          >
            <Input
              id="availability"
              name="availability"
              defaultValue={candidate?.availability ?? ""}
              placeholder="Bijv. per direct, per 1 september"
            />
          </Veld>
        </div>
      </Sectie>

      {isNieuw && (
        <>
          <Separator />
          <Sectie titel="AVG-toestemming">
            <p className="text-xs text-muted-foreground">
              Toestemming om gegevens te bewaren is verplicht en geldt 365
              dagen. Je krijgt 30 dagen vóór de einddatum een melding om te
              verlengen.
            </p>
            <Veld
              label="Toestemming vastgelegd via"
              htmlFor="consent_method"
              verplicht
              error={fouten.consent_method}
            >
              <Select name="consent_method">
                <SelectTrigger
                  id="consent_method"
                  className="w-full"
                  aria-invalid={!!fouten.consent_method}
                >
                  <SelectValue placeholder="Maak een keuze" />
                </SelectTrigger>
                <SelectContent>
                  {TOESTEMMING_OPTIES.map((optie) => (
                    <SelectItem key={optie} value={optie}>
                      {optie}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Veld>
          </Sectie>
        </>
      )}

      <Separator />

      <Sectie titel="CV">
        <label
          htmlFor="cv"
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/50 px-4 py-8 text-center transition-colors hover:border-ring hover:bg-muted",
            fouten.cv && "border-destructive"
          )}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (cvInputRef.current && e.dataTransfer.files.length > 0) {
              cvInputRef.current.files = e.dataTransfer.files;
              setCvNaam(e.dataTransfer.files[0].name);
            }
          }}
        >
          {cvNaam ? (
            <>
              <FileTextIcon className="size-5 text-primary" />
              <span className="text-sm font-medium">{cvNaam}</span>
              <span className="text-xs text-muted-foreground">
                Klik om een ander bestand te kiezen
              </span>
            </>
          ) : (
            <>
              <UploadIcon className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                Sleep een CV hierheen of klik om te kiezen
              </span>
              <span className="text-xs text-muted-foreground">
                PDF of Word, maximaal 10 MB
                {huidigCv ? ` · huidig: ${huidigCv}` : ""}
              </span>
            </>
          )}
          <input
            ref={cvInputRef}
            id="cv"
            name="cv"
            type="file"
            accept=".pdf,.doc,.docx"
            className="sr-only"
            onChange={(e) => setCvNaam(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        {fouten.cv && (
          <p role="alert" className="text-xs text-danger-deep">
            {fouten.cv}
          </p>
        )}
        {!isNieuw && huidigCv && !cvNaam && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="cv_verwijderen"
              value="1"
              className="size-4 accent-[var(--primary)]"
            />
            Huidig CV verwijderen
          </label>
        )}
      </Sectie>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2Icon className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
