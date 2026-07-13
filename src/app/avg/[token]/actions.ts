"use server";

import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type AvgKeuzeState =
  | { verlengd?: string; verwijderd?: boolean; error?: string }
  | undefined;

const TOKEN_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Kandidaat verlengt zelf de AVG-toestemming (365 dagen vanaf nu). */
export async function verlengToestemming(
  token: string
): Promise<AvgKeuzeState> {
  if (!TOKEN_REGEX.test(token)) return { error: "Deze link is niet geldig." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("avg_verleng", {
    p_token: token,
  });
  if (error) {
    return { error: "Er ging iets mis. Probeer het over een paar minuten opnieuw." };
  }
  if (!data) {
    return { error: "Deze link is niet (meer) geldig." };
  }
  return { verlengd: formatDate(data) };
}

/** Kandidaat laat zijn/haar gegevens verwijderen. */
export async function verwijderGegevens(
  token: string
): Promise<AvgKeuzeState> {
  if (!TOKEN_REGEX.test(token)) return { error: "Deze link is niet geldig." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("avg_verwijder", {
    p_token: token,
  });
  if (error) {
    return { error: "Er ging iets mis. Probeer het over een paar minuten opnieuw." };
  }
  if (!data) {
    return { error: "Deze link is niet (meer) geldig." };
  }
  return { verwijderd: true };
}
