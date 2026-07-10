import type { Consent } from "@/lib/types";

/**
 * AVG-weergavestatus, berekend uit het meest recente toestemmingsrecord.
 * We rekenen bij het renderen vanaf expires_at, zodat de badge ook klopt
 * vóórdat de dagelijkse cron-job (fase 4) de status in de database bijwerkt.
 */
export type AvgStatus = "actief" | "verloopt_binnenkort" | "verlopen" | "geen";

const DAGEN_30 = 30 * 24 * 60 * 60 * 1000;

export function avgStatus(
  consents: Pick<Consent, "granted_at" | "expires_at">[] | null | undefined
): { status: AvgStatus; expiresAt: Date | null } {
  if (!consents || consents.length === 0) {
    return { status: "geen", expiresAt: null };
  }

  const latest = consents.reduce((a, b) =>
    new Date(a.granted_at) >= new Date(b.granted_at) ? a : b
  );
  const expiresAt = new Date(latest.expires_at);
  const now = Date.now();

  if (expiresAt.getTime() <= now) return { status: "verlopen", expiresAt };
  if (expiresAt.getTime() - now <= DAGEN_30) {
    return { status: "verloopt_binnenkort", expiresAt };
  }
  return { status: "actief", expiresAt };
}

export const avgBadge: Record<
  AvgStatus,
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  actief: { label: "AVG actief", variant: "success" },
  verloopt_binnenkort: { label: "Verloopt binnenkort", variant: "warning" },
  verlopen: { label: "AVG verlopen", variant: "danger" },
  geen: { label: "Geen toestemming", variant: "danger" },
};
