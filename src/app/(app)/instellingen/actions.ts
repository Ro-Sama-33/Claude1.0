"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type StageState =
  | { error?: string; success?: boolean }
  | undefined;

const nameSchema = z
  .string()
  .trim()
  .min(1, "Geef de fase een naam.")
  .max(60, "Maximaal 60 tekens.");

// Hex-kleur (#RGB of #RRGGBB); de kleurkiezer levert altijd #RRGGBB.
const colorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Ongeldige kleurcode.");

function revalidate() {
  revalidatePath("/instellingen");
  revalidatePath("/vacatures");
}

export async function addStage(
  _prev: StageState,
  formData: FormData
): Promise<StageState> {
  const supabase = await createClient();

  const parsedName = nameSchema.safeParse(formData.get("name") ?? "");
  if (!parsedName.success) {
    return { error: parsedName.error.issues[0].message };
  }
  const parsedColor = colorSchema.safeParse(formData.get("color") ?? "#6B6580");
  const color = parsedColor.success ? parsedColor.data : "#6B6580";

  // Nieuwe fase achteraan plaatsen.
  const { data: laatste } = await supabase
    .from("pipeline_stages")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (laatste?.position ?? -1) + 1;

  const { error } = await supabase
    .from("pipeline_stages")
    .insert({ name: parsedName.data, color, position });
  if (error) return { error: "Toevoegen is niet gelukt. Probeer het opnieuw." };

  revalidate();
  return { success: true };
}

export async function updateStage(
  stageId: string,
  data: { name?: string; color?: string }
): Promise<StageState> {
  const supabase = await createClient();

  const patch: { name?: string; color?: string } = {};
  if (data.name !== undefined) {
    const parsed = nameSchema.safeParse(data.name);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    patch.name = parsed.data;
  }
  if (data.color !== undefined) {
    const parsed = colorSchema.safeParse(data.color);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    patch.color = parsed.data;
  }
  if (Object.keys(patch).length === 0) return { success: true };

  const { error } = await supabase
    .from("pipeline_stages")
    .update(patch)
    .eq("id", stageId);
  if (error) return { error: "Opslaan is niet gelukt. Probeer het opnieuw." };

  revalidate();
  return { success: true };
}

/** Slaat de volgorde op na het slepen; `orderedIds` is de volledige lijst. */
export async function reorderStages(orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("pipeline_stages")
        .update({ position: index })
        .eq("id", id)
    )
  );
  revalidate();
}

export async function deleteStage(stageId: string): Promise<StageState> {
  const supabase = await createClient();

  // Extra check vóór de DB-trigger, voor een nette melding.
  const { count } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("stage_id", stageId);
  if ((count ?? 0) > 0) {
    return {
      error:
        "Deze fase bevat nog kandidaten. Verplaats ze eerst naar een andere fase.",
    };
  }

  const { error } = await supabase
    .from("pipeline_stages")
    .delete()
    .eq("id", stageId);
  if (error) {
    return {
      error:
        "Verwijderen is niet gelukt. Mogelijk staan er nog kandidaten in deze fase.",
    };
  }

  revalidate();
  return { success: true };
}
