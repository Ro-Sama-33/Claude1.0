"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { VacancyStatus } from "@/lib/types";

export type VacancyFormState =
  | { error?: string; fieldError?: string; success?: boolean }
  | undefined;

const titleSchema = z
  .string()
  .trim()
  .min(1, "Geef de vacature een titel.")
  .max(160, "Maximaal 160 tekens.");

export async function createVacancy(
  _prev: VacancyFormState,
  formData: FormData
): Promise<VacancyFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Je sessie is verlopen. Log opnieuw in." };

  const parsed = titleSchema.safeParse(formData.get("title") ?? "");
  if (!parsed.success) {
    return { fieldError: parsed.error.issues[0].message };
  }

  const { data: vacancy, error } = await supabase
    .from("vacancies")
    .insert({ title: parsed.data })
    .select("id")
    .single();
  if (error || !vacancy) {
    return { error: "Opslaan is niet gelukt. Probeer het opnieuw." };
  }

  revalidatePath("/vacatures");
  redirect(`/vacatures/${vacancy.id}`);
}

export async function updateVacancy(
  vacancyId: string,
  _prev: VacancyFormState,
  formData: FormData
): Promise<VacancyFormState> {
  const supabase = await createClient();

  const parsed = titleSchema.safeParse(formData.get("title") ?? "");
  if (!parsed.success) {
    return { fieldError: parsed.error.issues[0].message };
  }

  const statusRaw = String(formData.get("status") ?? "open");
  const status: VacancyStatus = statusRaw === "gesloten" ? "gesloten" : "open";

  const { error } = await supabase
    .from("vacancies")
    .update({ title: parsed.data, status })
    .eq("id", vacancyId);
  if (error) {
    return { error: "Opslaan is niet gelukt. Probeer het opnieuw." };
  }

  revalidatePath("/vacatures");
  revalidatePath(`/vacatures/${vacancyId}`);
  return { success: true };
}

export async function setVacancyStatus(
  vacancyId: string,
  status: VacancyStatus
) {
  const supabase = await createClient();
  await supabase.from("vacancies").update({ status }).eq("id", vacancyId);
  revalidatePath("/vacatures");
  revalidatePath(`/vacatures/${vacancyId}`);
}

export async function deleteVacancy(vacancyId: string) {
  const supabase = await createClient();
  // applications cascaderen mee (migratie fase 3).
  const { error } = await supabase
    .from("vacancies")
    .delete()
    .eq("id", vacancyId);
  if (error) return;
  revalidatePath("/vacatures");
  redirect("/vacatures");
}

export type LinkState =
  | { error?: string; success?: boolean }
  | undefined;

/** Koppelt een kandidaat aan een vacature in de eerste funnel-fase. */
export async function linkCandidateToVacancy(
  candidateId: string,
  vacancyId: string
): Promise<LinkState> {
  const supabase = await createClient();

  const { data: firstStage } = await supabase
    .from("pipeline_stages")
    .select("id")
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!firstStage) {
    return {
      error:
        "Er zijn nog geen funnel-fases. Voeg er eerst een toe bij Instellingen.",
    };
  }

  const { count } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("vacancy_id", vacancyId)
    .eq("stage_id", firstStage.id);

  const { error } = await supabase.from("applications").insert({
    candidate_id: candidateId,
    vacancy_id: vacancyId,
    stage_id: firstStage.id,
    position: count ?? 0,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Deze kandidaat is al aan de vacature gekoppeld." };
    }
    return { error: "Koppelen is niet gelukt. Probeer het opnieuw." };
  }

  revalidatePath(`/vacatures/${vacancyId}`);
  revalidatePath(`/kandidaten/${candidateId}`);
  return { success: true };
}

export async function unlinkApplication(
  applicationId: string,
  vacancyId: string,
  candidateId: string
) {
  const supabase = await createClient();
  await supabase.from("applications").delete().eq("id", applicationId);
  revalidatePath(`/vacatures/${vacancyId}`);
  revalidatePath(`/kandidaten/${candidateId}`);
}

/**
 * Verplaatst een kaart naar een (nieuwe) fase en herschrijft de volgorde van
 * de doelkolom. `orderedIds` is de volledige kolom ná het slepen, inclusief de
 * verplaatste kaart — zo dekt één actie zowel herordenen als verplaatsen.
 */
export async function moveApplication(
  vacancyId: string,
  toStageId: string,
  orderedIds: string[]
) {
  const supabase = await createClient();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("applications")
        .update({ stage_id: toStageId, position: index })
        .eq("id", id)
    )
  );

  revalidatePath(`/vacatures/${vacancyId}`);
}
