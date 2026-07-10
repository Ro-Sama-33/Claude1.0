"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/** Vinkt één melding af (read_at zetten). */
export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null);

  revalidatePath("/", "layout");
}

/** Vinkt alle openstaande meldingen af. */
export async function markAllNotificationsRead() {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  revalidatePath("/", "layout");
}
