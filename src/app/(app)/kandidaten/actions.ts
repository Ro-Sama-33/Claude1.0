"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type CandidateFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
      success?: boolean;
    }
  | undefined;

const MAX_CV_BYTES = 10 * 1024 * 1024;
const CV_EXTENSIES = ["pdf", "doc", "docx"];

const tekstveld = (max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim())
    .pipe(z.string().max(max, `Maximaal ${max} tekens.`))
    .transform((v) => (v === "" ? null : v));

const candidateSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "Voornaam is verplicht.")
    .max(100, "Maximaal 100 tekens."),
  last_name: z
    .string()
    .trim()
    .min(1, "Achternaam is verplicht.")
    .max(100, "Maximaal 100 tekens."),
  email: tekstveld(200).refine(
    (v) => v === null || /^\S+@\S+\.\S+$/.test(v),
    "Vul een geldig e-mailadres in."
  ),
  phone: tekstveld(40),
  city: tekstveld(100),
  current_role: tekstveld(120),
  salary_indication: tekstveld(120),
  hours_per_week: z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim())
    .refine(
      (v) => v === "" || (/^\d+$/.test(v) && +v >= 1 && +v <= 80),
      "Vul een aantal uren tussen 1 en 80 in."
    )
    .transform((v) => (v === "" ? null : parseInt(v, 10))),
  contract_preference: tekstveld(60),
  availability: tekstveld(200),
  source: tekstveld(120),
});

function rawCandidate(formData: FormData) {
  const veld = (naam: string) => {
    const waarde = formData.get(naam);
    return typeof waarde === "string" ? waarde : "";
  };
  return {
    first_name: veld("first_name"),
    last_name: veld("last_name"),
    email: veld("email"),
    phone: veld("phone"),
    city: veld("city"),
    current_role: veld("current_role"),
    salary_indication: veld("salary_indication"),
    hours_per_week: veld("hours_per_week"),
    contract_preference: veld("contract_preference"),
    availability: veld("availability"),
    source: veld("source"),
  };
}

function cvBestand(formData: FormData): {
  file: File | null;
  error?: string;
} {
  const cv = formData.get("cv");
  if (!(cv instanceof File) || cv.size === 0) return { file: null };
  if (cv.size > MAX_CV_BYTES) {
    return { file: null, error: "Het CV mag maximaal 10 MB zijn." };
  }
  const ext = cv.name.split(".").pop()?.toLowerCase() ?? "";
  if (!CV_EXTENSIES.includes(ext)) {
    return {
      file: null,
      error: "Alleen PDF- of Word-bestanden (.pdf, .doc, .docx).",
    };
  }
  return { file: cv };
}

function cvOpslagPad(candidateId: string, bestandsnaam: string) {
  const veilig = bestandsnaam.replace(/[^\w.\-]+/g, "_").slice(-80);
  return `${candidateId}/${Date.now()}_${veilig}`;
}

function verzamelFouten(
  parsed: ReturnType<typeof candidateSchema.safeParse>
): Record<string, string> {
  if (parsed.success) return {};
  const fouten: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const veld = String(issue.path[0] ?? "");
    if (veld && !fouten[veld]) fouten[veld] = issue.message;
  }
  return fouten;
}

export async function createCandidate(
  _prev: CandidateFormState,
  formData: FormData
): Promise<CandidateFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Je sessie is verlopen. Log opnieuw in." };

  const parsed = candidateSchema.safeParse(rawCandidate(formData));
  const fieldErrors = verzamelFouten(parsed);

  const consentMethod = String(formData.get("consent_method") ?? "").trim();
  if (!consentMethod) {
    fieldErrors.consent_method =
      "Leg vast hoe de kandidaat toestemming heeft gegeven.";
  }

  const cv = cvBestand(formData);
  if (cv.error) fieldErrors.cv = cv.error;

  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: "Controleer de gemarkeerde velden." };
  }

  const { data: candidate, error: insertError } = await supabase
    .from("candidates")
    .insert(parsed.data)
    .select("id")
    .single();
  if (insertError || !candidate) {
    return { error: "Opslaan is niet gelukt. Probeer het opnieuw." };
  }

  // AVG standaard aan: toestemmingsrecord hoort bij het aanmaken zelf.
  const { error: consentError } = await supabase.from("consents").insert({
    candidate_id: candidate.id,
    method: consentMethod,
  });
  if (consentError) {
    await supabase.from("candidates").delete().eq("id", candidate.id);
    return {
      error: "Vastleggen van de AVG-toestemming is niet gelukt. Probeer het opnieuw.",
    };
  }

  let cvMislukt = false;
  if (cv.file) {
    const pad = cvOpslagPad(candidate.id, cv.file.name);
    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(pad, cv.file, { contentType: cv.file.type || undefined });
    if (uploadError) {
      cvMislukt = true;
    } else {
      await supabase
        .from("candidates")
        .update({ cv_path: pad })
        .eq("id", candidate.id);
    }
  }

  revalidatePath("/kandidaten");
  redirect(`/kandidaten/${candidate.id}${cvMislukt ? "?cv_fout=1" : ""}`);
}

export async function updateCandidate(
  candidateId: string,
  _prev: CandidateFormState,
  formData: FormData
): Promise<CandidateFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Je sessie is verlopen. Log opnieuw in." };

  const parsed = candidateSchema.safeParse(rawCandidate(formData));
  const fieldErrors = verzamelFouten(parsed);

  const cv = cvBestand(formData);
  if (cv.error) fieldErrors.cv = cv.error;

  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: "Controleer de gemarkeerde velden." };
  }

  const { data: huidig, error: fetchError } = await supabase
    .from("candidates")
    .select("cv_path")
    .eq("id", candidateId)
    .single();
  if (fetchError) {
    return { error: "Kandidaat niet gevonden." };
  }

  let nieuwCvPad: string | null | undefined = undefined;
  if (cv.file) {
    const pad = cvOpslagPad(candidateId, cv.file.name);
    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(pad, cv.file, { contentType: cv.file.type || undefined });
    if (uploadError) {
      return {
        error: "Het CV kon niet worden geüpload. De overige wijzigingen zijn nog niet opgeslagen.",
      };
    }
    nieuwCvPad = pad;
  } else if (formData.get("cv_verwijderen") === "1") {
    nieuwCvPad = null;
  }

  const { error: updateError } = await supabase
    .from("candidates")
    .update({
      ...parsed.data,
      ...(nieuwCvPad !== undefined ? { cv_path: nieuwCvPad } : {}),
    })
    .eq("id", candidateId);
  if (updateError) {
    return { error: "Opslaan is niet gelukt. Probeer het opnieuw." };
  }

  // Oud CV pas opruimen als de rij succesvol is bijgewerkt.
  if (nieuwCvPad !== undefined && huidig.cv_path) {
    await supabase.storage.from("cvs").remove([huidig.cv_path]);
  }

  revalidatePath("/kandidaten");
  revalidatePath(`/kandidaten/${candidateId}`);
  return { success: true };
}

export async function setCandidateStatus(
  candidateId: string,
  status: "actief" | "gearchiveerd"
) {
  const supabase = await createClient();
  // Geanonimiseerde kandidaten blijven geanonimiseerd (fase 4-flow).
  await supabase
    .from("candidates")
    .update({ status })
    .eq("id", candidateId)
    .in("status", ["actief", "gearchiveerd"]);

  revalidatePath("/kandidaten");
  revalidatePath(`/kandidaten/${candidateId}`);
}

export async function deleteCandidate(candidateId: string) {
  const supabase = await createClient();

  const { data: candidate } = await supabase
    .from("candidates")
    .select("cv_path")
    .eq("id", candidateId)
    .single();

  if (candidate?.cv_path) {
    await supabase.storage.from("cvs").remove([candidate.cv_path]);
  }

  // Notities, contactmomenten, consents, applications en notificaties
  // cascaderen mee (migraties fase 2–4).
  const { error } = await supabase
    .from("candidates")
    .delete()
    .eq("id", candidateId);
  if (error) return;

  revalidatePath("/kandidaten");
  redirect("/kandidaten");
}

/**
 * Verlengt de AVG-toestemming: nieuw consent-record (audit-trail), opnieuw
 * 365 dagen vanaf nu (via de default/trigger op consents). Openstaande
 * AVG-meldingen voor de kandidaat worden afgevinkt.
 */
export async function renewConsent(candidateId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("consents")
    .insert({ candidate_id: candidateId, method: "Verlenging" });
  if (error) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("candidate_id", candidateId)
    .in("type", ["avg_verloopt", "avg_verlopen"])
    .is("read_at", null);

  revalidatePath("/");
  revalidatePath("/kandidaten");
  revalidatePath(`/kandidaten/${candidateId}`);
}

/**
 * Anonimiseert een kandidaat (AVG): persoonsgegevens overschreven, CV uit
 * Storage verwijderd, notities gewist, funnel-koppelingen verwijderd, status
 * `geanonimiseerd`. Consents blijven als audit-trail (bevatten geen PII).
 */
export async function anonymizeCandidate(candidateId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: candidate } = await supabase
    .from("candidates")
    .select("cv_path, status")
    .eq("id", candidateId)
    .single();
  if (!candidate || candidate.status === "geanonimiseerd") return;

  if (candidate.cv_path) {
    await supabase.storage.from("cvs").remove([candidate.cv_path]);
  }

  await supabase.from("candidate_notes").delete().eq("candidate_id", candidateId);
  await supabase.from("applications").delete().eq("candidate_id", candidateId);
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("candidate_id", candidateId)
    .is("read_at", null);

  const { error } = await supabase
    .from("candidates")
    .update({
      first_name: "[verwijderd]",
      last_name: "[verwijderd]",
      email: null,
      phone: null,
      city: null,
      current_role: null,
      salary_indication: null,
      hours_per_week: null,
      contract_preference: null,
      availability: null,
      source: null,
      cv_path: null,
      status: "geanonimiseerd",
    })
    .eq("id", candidateId);
  if (error) return;

  revalidatePath("/");
  revalidatePath("/kandidaten");
  revalidatePath(`/kandidaten/${candidateId}`);
}

export type NoteFormState =
  | { error?: string; success?: boolean }
  | undefined;

function notitieTekst(formData: FormData): { body?: string; error?: string } {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Schrijf eerst een notitie." };
  if (body.length > 4000) return { error: "Maximaal 4000 tekens." };
  return { body };
}

export async function addNote(
  candidateId: string,
  _prev: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Je sessie is verlopen. Log opnieuw in." };

  const { body, error } = notitieTekst(formData);
  if (error) return { error };

  const { error: insertError } = await supabase.from("candidate_notes").insert({
    candidate_id: candidateId,
    body: body!,
    created_by: user.id,
  });
  if (insertError) {
    return { error: "Opslaan is niet gelukt. Probeer het opnieuw." };
  }

  revalidatePath(`/kandidaten/${candidateId}`);
  return { success: true };
}

export async function updateNote(
  noteId: string,
  candidateId: string,
  _prev: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const supabase = await createClient();

  const { body, error } = notitieTekst(formData);
  if (error) return { error };

  // RLS staat alleen bewerken van eigen notities toe.
  const { error: updateError } = await supabase
    .from("candidate_notes")
    .update({ body: body! })
    .eq("id", noteId);
  if (updateError) {
    return { error: "Bewerken is niet gelukt. Probeer het opnieuw." };
  }

  revalidatePath(`/kandidaten/${candidateId}`);
  return { success: true };
}

export async function deleteNote(noteId: string, candidateId: string) {
  const supabase = await createClient();
  await supabase.from("candidate_notes").delete().eq("id", noteId);
  revalidatePath(`/kandidaten/${candidateId}`);
}
