"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ApproveResult =
  | { tempPassword?: string; email?: string; error?: string }
  | undefined;

/** Genereert een leesbaar tijdelijk wachtwoord (letters + cijfers). */
function tempWachtwoord(lengte = 12) {
  const alfabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(lengte);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alfabet[b % alfabet.length]).join("");
}

/**
 * Keurt een toegangsverzoek goed: maakt het account aan (service-role) en
 * geeft een tijdelijk wachtwoord terug om te delen. De nieuwe collega logt
 * daarmee in en wijzigt het wachtwoord via "Mijn account".
 */
export async function approveRequest(id: string): Promise<ApproveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Je sessie is verlopen. Log opnieuw in." };

  const { data: verzoek } = await supabase
    .from("access_requests")
    .select("id, full_name, email, status")
    .eq("id", id)
    .maybeSingle();
  if (!verzoek || verzoek.status !== "open") {
    return { error: "Dit verzoek is al afgehandeld." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      error:
        "Accounts aanmaken kan nog niet: stel SUPABASE_SERVICE_ROLE_KEY in bij de omgevingsvariabelen (Vercel) en deploy opnieuw.",
    };
  }

  const tempPassword = tempWachtwoord();
  const { error: createError } = await admin.auth.admin.createUser({
    email: verzoek.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: verzoek.full_name },
  });
  if (createError) {
    const bestaatAl =
      createError.code === "email_exists" ||
      /already been registered|already exists/i.test(createError.message);
    if (!bestaatAl) {
      const sleutelFout =
        createError.status === 401 ||
        createError.status === 403 ||
        /not allowed|invalid|jwt|api key|unauthorized/i.test(
          createError.message
        );
      const reden = sleutelFout
        ? "de service-role sleutel klopt niet of mist rechten. Controleer SUPABASE_SERVICE_ROLE_KEY in Vercel (moet de 'service_role secret' zijn) en deploy opnieuw."
        : createError.message;
      return { error: `Account aanmaken is niet gelukt: ${reden}` };
    }
    // Account bestond al: verzoek gewoon afronden, geen nieuw wachtwoord.
    await supabase
      .from("access_requests")
      .update({
        status: "goedgekeurd",
        handled_at: new Date().toISOString(),
        handled_by: user.id,
      })
      .eq("id", id);
    revalidatePath("/instellingen");
    return {
      email: verzoek.email,
      error:
        "Er bestond al een account met dit e-mailadres. Het verzoek is afgerond; deel eventueel de 'Wachtwoord vergeten'-link.",
    };
  }

  await supabase
    .from("access_requests")
    .update({
      status: "goedgekeurd",
      handled_at: new Date().toISOString(),
      handled_by: user.id,
    })
    .eq("id", id);

  revalidatePath("/instellingen");
  return { tempPassword, email: verzoek.email };
}

/** Wijst een toegangsverzoek af (maakt geen account aan). */
export async function rejectRequest(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Je sessie is verlopen. Log opnieuw in." };

  await supabase
    .from("access_requests")
    .update({
      status: "afgewezen",
      handled_at: new Date().toISOString(),
      handled_by: user.id,
    })
    .eq("id", id)
    .eq("status", "open");

  revalidatePath("/instellingen");
  return {};
}
