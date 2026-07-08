import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "./config";
import type { Database } from "@/lib/types";

/** Supabase-client voor Server Components, Server Actions en Route Handlers. */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll vanuit een Server Component: cookies worden dan door de
          // middleware ververst, dus dit mag stil falen.
        }
      },
    },
  });
}
