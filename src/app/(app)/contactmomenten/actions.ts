"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type ContactState =
  | { error?: string; fieldErrors?: Record<string, string>; success?: boolean }
  | undefined;

const TYPES = ["gebeld", "gemaild", "gesprek", "overig"] as const;

const schema = z.object({
  candidate_id: z.string().uuid("Onbekende kandidaat."),
  type: z.enum(TYPES),
  // datetime-local levert "YYYY-MM-DDTHH:mm"
  occurred_at: z
    .string()
    .min(1, "Kies een datum en tijd.")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Ongeldige datum."),
  note: z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim())
    .pipe(z.string().max(2000, "Maximaal 2000 tekens."))
    .transform((v) => (v === "" ? null : v)),
});

function parse(formData: FormData) {
  return schema.safeParse({
    candidate_id: String(formData.get("candidate_id") ?? ""),
    type: String(formData.get("type") ?? "gebeld"),
    occurred_at: String(formData.get("occurred_at") ?? ""),
    note: formData.get("note"),
  });
}

function fieldErrors(
  parsed: ReturnType<typeof schema.safeParse>
): Record<string, string> {
  if (parsed.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

function revalidate(candidateId: string) {
  revalidatePath("/kalender");
  revalidatePath("/kandidaten");
  revalidatePath(`/kandidaten/${candidateId}`);
  revalidatePath("/");
}

export async function addContactMoment(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Je sessie is verlopen. Log opnieuw in." };

  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      error: "Controleer de gemarkeerde velden.",
      fieldErrors: fieldErrors(parsed),
    };
  }

  const occurredAt = new Date(parsed.data.occurred_at);
  const { error } = await supabase.from("contact_moments").insert({
    candidate_id: parsed.data.candidate_id,
    type: parsed.data.type,
    occurred_at: occurredAt.toISOString(),
    note: parsed.data.note,
    created_by: user.id,
  });
  if (error) {
    return { error: "Opslaan is niet gelukt. Probeer het opnieuw." };
  }

  // Een geregistreerd contact in het verleden lost de "3 maanden"-melding op.
  if (occurredAt.getTime() <= Date.now()) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("candidate_id", parsed.data.candidate_id)
      .eq("type", "geen_contact_3m")
      .is("read_at", null);
  }

  revalidate(parsed.data.candidate_id);
  return { success: true };
}

export async function updateContactMoment(
  momentId: string,
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const supabase = await createClient();

  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      error: "Controleer de gemarkeerde velden.",
      fieldErrors: fieldErrors(parsed),
    };
  }

  // RLS staat alleen bewerken van eigen momenten toe.
  const { error } = await supabase
    .from("contact_moments")
    .update({
      type: parsed.data.type,
      occurred_at: new Date(parsed.data.occurred_at).toISOString(),
      note: parsed.data.note,
    })
    .eq("id", momentId);
  if (error) {
    return { error: "Bewerken is niet gelukt. Probeer het opnieuw." };
  }

  revalidate(parsed.data.candidate_id);
  return { success: true };
}

export async function deleteContactMoment(
  momentId: string,
  candidateId: string
) {
  const supabase = await createClient();
  await supabase.from("contact_moments").delete().eq("id", momentId);
  revalidate(candidateId);
}
