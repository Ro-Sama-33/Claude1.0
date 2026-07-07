/**
 * Leest de Supabase-omgevingsvariabelen en faalt met een duidelijke melding
 * als ze ontbreken. De publishable key heeft de voorkeur; de legacy anon key
 * blijft werken voor bestaande projecten.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase-configuratie ontbreekt. Kopieer .env.example naar .env.local en vul NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in (Supabase-dashboard → Project Settings → API Keys)."
    );
  }

  return { url, key };
}
