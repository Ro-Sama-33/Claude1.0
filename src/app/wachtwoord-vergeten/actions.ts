"use server";

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

export type ResetState = { message?: string; error?: string } | undefined;

/**
 * Stuurt een herstelmail met een link naar /wachtwoord-herstellen.
 * We melden altijd hetzelfde (of het adres bestaat of niet), zodat niet te
 * achterhalen is welke e-mailadressen een account hebben.
 */
export async function requestPasswordReset(
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Vul een geldig e-mailadres in." };
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const neutraal =
    "Als er een account bij dit e-mailadres hoort, is er een herstel-mail verstuurd. Controleer je inbox (en spam).";

  if (!host) return { message: neutraal };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${proto}://${host}/wachtwoord-herstellen`,
  });

  return { message: neutraal };
}
