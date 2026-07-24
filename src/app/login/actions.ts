"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Vul je e-mailadres en wachtwoord in." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const meldingen: Record<string, string> = {
      invalid_credentials:
        "Onjuiste combinatie van e-mailadres en wachtwoord.",
      email_not_confirmed:
        "Dit account is nog niet bevestigd. Neem contact op met de beheerder.",
      over_request_rate_limit:
        "Te veel pogingen. Wacht een paar minuten en probeer het opnieuw.",
      user_banned:
        "Dit account is geblokkeerd. Neem contact op met de beheerder.",
    };
    return {
      error:
        meldingen[error.code ?? ""] ??
        `Inloggen is niet gelukt (${
          error.code ?? error.status ?? "onbekend"
        }). Probeer het later opnieuw.`,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
