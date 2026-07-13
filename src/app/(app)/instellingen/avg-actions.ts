"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { avgStatus } from "@/lib/avg";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type AvgEmailState =
  | { error?: string; success?: string }
  | undefined;

const schema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, "Onderwerp is verplicht.")
    .max(200, "Maximaal 200 tekens."),
  body: z
    .string()
    .trim()
    .min(1, "De mailtekst is verplicht.")
    .max(5000, "Maximaal 5000 tekens."),
});

/** Slaat de algemene AVG-mailtekst op (één rij in app_settings). */
export async function updateAvgEmail(
  _prev: AvgEmailState,
  formData: FormData
): Promise<AvgEmailState> {
  const supabase = await createClient();

  const parsed = schema.safeParse({
    subject: String(formData.get("subject") ?? ""),
    body: String(formData.get("body") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase
    .from("app_settings")
    .update({
      avg_email_subject: parsed.data.subject,
      avg_email_body: parsed.data.body,
    })
    .eq("id", true);
  if (error) return { error: "Opslaan is niet gelukt. Probeer het opnieuw." };

  revalidatePath("/instellingen");
  return { success: "AVG-mailtekst opgeslagen." };
}

/** Vult {{naam}} en {{einddatum}} in de mailtekst in. */
function render(template: string, naam: string, einddatum: string) {
  return template
    .replaceAll("{{naam}}", naam)
    .replaceAll("{{einddatum}}", einddatum);
}

function escapeHtml(tekst: string) {
  return tekst
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * HTML-versie van de mail: de (bewerkbare) tekst + een knop naar de
 * persoonlijke AVG-pagina waar de kandidaat verlengt of laat verwijderen.
 */
function htmlMail(tekst: string, linkUrl: string) {
  const alineas = escapeHtml(tekst)
    .split("\n\n")
    .map(
      (p) =>
        `<p style="margin:0 0 16px;line-height:1.6;">${p.replaceAll("\n", "<br />")}</p>`
    )
    .join("");
  return `<div style="margin:0 auto;max-width:560px;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1F1A2E;">
${alineas}
<p style="margin:24px 0;">
  <a href="${linkUrl}" style="display:inline-block;background-color:#5B2D90;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;">Geef je keuze door</a>
</p>
<p style="margin:0 0 8px;font-size:13px;color:#6B6580;line-height:1.6;">
  Werkt de knop niet? Kopieer dan deze link naar je browser:<br />
  <a href="${linkUrl}" style="color:#5B2D90;">${linkUrl}</a>
</p>
</div>`;
}

/**
 * Verstuurt de AVG-mail naar iedereen wiens toestemming binnen 30 dagen
 * verloopt. Echt versturen gebeurt via Resend zodra RESEND_API_KEY en
 * RESEND_FROM zijn ingesteld; zonder die keys wordt niets verstuurd en krijg
 * je het aantal beoogde ontvangers terug.
 */
export async function sendAvgReminders(): Promise<AvgEmailState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Je sessie is verlopen. Log opnieuw in." };

  const [{ data: kandidaten }, { data: settings }, { data: eigenProfiel }] =
    await Promise.all([
      supabase
        .from("candidates")
        .select(
          "id, first_name, last_name, email, avg_token, owner:profiles(full_name, email), consents(granted_at, expires_at)"
        )
        .eq("status", "actief"),
      supabase
        .from("app_settings")
        .select("avg_email_subject, avg_email_body")
        .eq("id", true)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  // Wie geen eigen beheerder heeft, valt terug op degene die nu verstuurt.
  const fallbackBeheerder = {
    full_name: eigenProfiel?.full_name?.trim() || "Jump Into People",
    email: eigenProfiel?.email?.trim() || user.email || "",
  };

  const ontvangers = (kandidaten ?? [])
    .map((k) => ({ ...k, avg: avgStatus(k.consents) }))
    .filter((k) => k.email && k.avg.status === "verloopt_binnenkort");

  if (ontvangers.length === 0) {
    return { success: "Geen kandidaten van wie de toestemming binnen 30 dagen verloopt." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    return {
      error: `E-mailprovider nog niet ingesteld. ${ontvangers.length} kandida${
        ontvangers.length === 1 ? "at" : "ten"
      } zou(den) een mail krijgen. Stel RESEND_API_KEY en RESEND_FROM in om echt te versturen.`,
    };
  }

  const subject = settings?.avg_email_subject ?? "Verlenging AVG-toestemming";
  const template = settings?.avg_email_body ?? "";

  // RESEND_FROM kan een kaal adres zijn of al "Naam <adres>"; we gebruiken
  // alleen het adres en zetten daar de naam van de beheerder voor.
  const fromAdres = from.match(/<([^>]+)>/)?.[1] ?? from;

  // Basis-URL voor de persoonlijke AVG-link, afgeleid van het domein waarop
  // de recruiter nu werkt (werkt zonder extra configuratie op Vercel).
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (!host) {
    return { error: "De site-URL kon niet worden bepaald. Probeer het opnieuw." };
  }
  const basisUrl = `${proto}://${host}`;

  let verstuurd = 0;
  for (const k of ontvangers) {
    const naam = `${k.first_name} ${k.last_name}`;
    const einddatum = formatDate(k.avg.expiresAt);
    const linkUrl = `${basisUrl}/avg/${k.avg_token}`;
    const tekst = render(template, naam, einddatum);
    const beheerder = {
      full_name: k.owner?.full_name?.trim() || fallbackBeheerder.full_name,
      email: k.owner?.email?.trim() || fallbackBeheerder.email,
    };
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Afzendernaam = beheerder; het adres blijft het geverifieerde
        // domeinadres (eis van e-mailproviders), antwoorden gaan naar de
        // beheerder zelf.
        from: `${beheerder.full_name.replaceAll('"', "")} <${fromAdres}>`,
        ...(beheerder.email ? { reply_to: beheerder.email } : {}),
        to: k.email,
        subject,
        html: htmlMail(tekst, linkUrl),
        text: `${tekst}\n\nGeef je keuze door (verlengen of verwijderen) via:\n${linkUrl}`,
      }),
    });
    if (res.ok) verstuurd += 1;
  }

  return {
    success: `AVG-mail verstuurd naar ${verstuurd} van ${ontvangers.length} kandidaten, namens de beheerder van elke kandidaat.`,
  };
}
