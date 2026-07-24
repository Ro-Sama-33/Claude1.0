import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "./config";
import type { Database } from "@/lib/types";

/**
 * Supabase-client met de service-role sleutel. Uitsluitend server-side:
 * de sleutel omzeilt RLS en mag NOOIT in de browser terechtkomen. Alleen
 * gebruiken voor beheertaken zoals het aanmaken van accounts na goedkeuring.
 *
 * Geeft null terug als de sleutel niet is ingesteld, zodat de aanroeper
 * netjes kan melden dat de omgeving nog geconfigureerd moet worden.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  const { url } = getSupabaseEnv();
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
