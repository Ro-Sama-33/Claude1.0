"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type HerstelState = { error?: string; success?: boolean } | undefined;

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Kies een wachtwoord van minimaal 8 tekens.")
      .max(72, "Maximaal 72 tekens."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "De twee wachtwoorden zijn niet gelijk.",
  });

/** Stelt het nieuwe wachtwoord in tijdens de herstel-sessie. */
export async function updatePassword(
  _prev: HerstelState,
  formData: FormData
): Promise<HerstelState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "De herstel-link is verlopen. Vraag een nieuwe aan via 'Wachtwoord vergeten'.",
    };
  }

  const parsed = schema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: "Opslaan is niet gelukt. Vraag eventueel een nieuwe link aan." };
  }

  await supabase.auth.signOut();
  return { success: true };
}
