import { redirect } from "next/navigation";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  // De middleware beschermt alle routes al; dit is de tweede verdedigingslinie
  // en levert meteen de gegevens voor het gebruikersmenu.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: notifs }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("notifications")
      .select(
        "id, type, message, created_at, candidate:candidates(id, first_name, last_name)"
      )
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const notifications = (notifs ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    createdAt: n.created_at,
    candidateId: n.candidate?.id ?? null,
    candidateName: n.candidate
      ? `${n.candidate.first_name} ${n.candidate.last_name}`
      : null,
  }));

  return (
    <div className="min-h-svh bg-surface/40">
      <Sidebar />
      <div className="flex min-h-svh flex-col md:pl-60">
        <Topbar
          name={profile?.full_name ?? ""}
          email={user.email ?? ""}
          notifications={notifications}
        />
        <main className="flex-1 px-4 py-6 md:px-8">
          {/* DESIGN.md: content max-breedte 1280px */}
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
