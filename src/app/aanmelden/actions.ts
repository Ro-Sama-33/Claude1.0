"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type AanmeldState = { message?: string; error?: string } | undefined;

const schema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Vul je naam in.")
    .max(120, "Maximaal 120 tekens."),
  email: z
    .string()
    .trim()
    .max(200, "Maximaal 200 tekens.")
    .refine((v) => /^\S+@\S+\.\S+$/.test(v), "Vul een geldig e-mailadres in."),
  note: z.string().trim().max(500, "Maximaal 500 tekens.").optional(),
});

/**
 * Legt een toegangsverzoek vast (maakt GEEN account aan). We melden altijd
 * hetzelfde, ook als er al een verzoek of account bestaat, zodat niet te
 * achterhalen is welke adressen bekend zijn.
 */
export async function requestAccess(
  _prev: AanmeldState,
  formData: FormData
): Promise<AanmeldState> {
  const parsed = schema.safeParse({
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const bevestiging =
    "Bedankt! Je aanvraag is verstuurd. Een beheerder beoordeelt 'm; je krijgt bericht zodra je account klaarstaat.";

  const supabase = await createClient();
  const { error } = await supabase.from("access_requests").insert({
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    note: parsed.data.note || null,
  });

  // Een dubbel openstaand verzoek (unieke index) is geen fout voor de bezoeker.
  if (error && error.code !== "23505") {
    return { error: "Versturen is niet gelukt. Probeer het later opnieuw." };
  }

  return { message: bevestiging };
}
