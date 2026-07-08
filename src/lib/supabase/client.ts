import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./config";
import type { Database } from "@/lib/types";

/** Supabase-client voor gebruik in Client Components (browser). */
export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}
