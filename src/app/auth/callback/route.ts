import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Wisselt de code uit een auth-mail (bijv. wachtwoordherstel) server-side in
 * voor een sessie en stuurt daarna door naar `next`. Server-side omdat de
 * PKCE-verifier in een cookie staat die alleen de server kan lezen.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const nextPad = searchParams.get("next") ?? "/";

  // Absolute basis-URL uit de (proxy-)headers, zodat de redirect naar het
  // juiste publieke adres wijst i.p.v. een interne host.
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const basis = host ? `${proto}://${host}` : request.nextUrl.origin;
  const veiligPad = nextPad.startsWith("/") ? nextPad : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${basis}${veiligPad}`);
    }
  }

  return NextResponse.redirect(`${basis}/wachtwoord-vergeten?fout=verlopen`);
}
