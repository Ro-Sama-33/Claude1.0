"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type ChangePasswordState =
  | { error?: string; success?: string }
  | undefined;

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

/** Wijzigt het wachtwoord van de ingelogde gebruiker. */
export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Je sessie is verlopen. Log opnieuw in." };

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
    return {
      error:
        error.code === "same_password"
          ? "Dit is je huidige wachtwoord. Kies een nieuw wachtwoord."
          : "Wijzigen is niet gelukt. Probeer het opnieuw.",
    };
  }

  return { success: "Je wachtwoord is gewijzigd." };
}
