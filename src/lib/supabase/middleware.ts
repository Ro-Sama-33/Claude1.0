import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv } from "./config";

/** Routes die zonder inloggen bereikbaar zijn. */
const PUBLIC_PATHS = ["/login"];

/**
 * Ververst de auth-sessie op elke request en beschermt alle overige routes:
 * niet ingelogd → /login, wel ingelogd op /login → dashboard.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Geen code tussen createServerClient en getUser: anders kan de sessie
  // onverwacht verlopen (zie Supabase SSR-documentatie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return withCookies(NextResponse.redirect(redirectUrl), supabaseResponse);
  }

  // Alleen /login stuurt ingelogde gebruikers door; de openbare AVG-pagina
  // moet ook voor ingelogde recruiters gewoon te bekijken zijn.
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return withCookies(NextResponse.redirect(redirectUrl), supabaseResponse);
  }

  return supabaseResponse;
}

/** Kopieert de (ververste) auth-cookies mee naar een redirect-response. */
function withCookies(response: NextResponse, from: NextResponse) {
  from.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}
