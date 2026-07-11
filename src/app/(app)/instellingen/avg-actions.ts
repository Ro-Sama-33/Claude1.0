"use server";

import { revalidatePath } from "next/cache";
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

/**
 * Verstuurt de AVG-mail naar iedereen wiens toestemming binnen 30 dagen
 * verloopt. Echt versturen gebeurt via Resend zodra RESEND_API_KEY en
 * RESEND_FROM zijn ingesteld; zonder die keys wordt niets verstuurd en krijg
 * je het aantal beoogde ontvangers terug.
 */
export async function sendAvgReminders(): Promise<AvgEmailState> {
  const supabase = await createClient();

  const [{ data: kandidaten }, { data: settings }] = await Promise.all([
    supabase
      .from("candidates")
      .select("id, first_name, last_name, email, consents(granted_at, expires_at)")
      .eq("status", "actief"),
    supabase
      .from("app_settings")
      .select("avg_email_subject, avg_email_body")
      .eq("id", true)
      .maybeSingle(),
  ]);

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

  let verstuurd = 0;
  for (const k of ontvangers) {
    const naam = `${k.first_name} ${k.last_name}`;
    const einddatum = formatDate(k.avg.expiresAt);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: k.email,
        subject,
        text: render(template, naam, einddatum),
      }),
    });
    if (res.ok) verstuurd += 1;
  }

  return {
    success: `AVG-mail verstuurd naar ${verstuurd} van ${ontvangers.length} kandidaten.`,
  };
}
