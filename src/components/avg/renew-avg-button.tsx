"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, ShieldCheckIcon } from "lucide-react";

import { renewConsent } from "@/app/(app)/kandidaten/actions";
import { Button } from "@/components/ui/button";

/** Verlengt de AVG-toestemming (opnieuw 365 dagen). Herbruikbaar op profiel én dashboard. */
export function RenewAvgButton({
  candidateId,
  variant = "outline",
  size = "default",
  label = "Verleng AVG",
  compactLabel,
}: {
  candidateId: string;
  variant?: "default" | "outline";
  size?: "default" | "sm";
  label?: string;
  compactLabel?: boolean;
}) {
  const router = useRouter();
  const [bezig, setBezig] = React.useState(false);

  async function verleng() {
    setBezig(true);
    await renewConsent(candidateId);
    setBezig(false);
    router.refresh();
  }

  return (
    <Button variant={variant} size={size} onClick={verleng} disabled={bezig}>
      {bezig ? (
        <Loader2Icon className="animate-spin" />
      ) : (
        <ShieldCheckIcon />
      )}
      <span className={compactLabel ? "hidden lg:inline" : undefined}>
        {label}
      </span>
    </Button>
  );
}
