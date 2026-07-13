"use client";

import * as React from "react";
import { Loader2Icon, XIcon } from "lucide-react";

import {
  rejectApplication,
  setApplicationStage,
} from "@/app/(app)/vacatures/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type StageOptie = { id: string; name: string; color: string };

/**
 * Fase-beheer voor één vacature-koppeling op het kandidaatprofiel:
 * een keuzemenu met alle funnel-fases + een aparte afwijzen-knop.
 */
export function ApplicationStageControl({
  applicationId,
  vacancyId,
  candidateId,
  stageId,
  stages,
}: {
  applicationId: string;
  vacancyId: string;
  candidateId: string;
  stageId: string;
  stages: StageOptie[];
}) {
  const [bezig, setBezig] = React.useState(false);
  const [fout, setFout] = React.useState<string | null>(null);

  const afgewezen = stages.find((s) => s.name.toLowerCase() === "afgewezen");
  const isAfgewezen = !!afgewezen && stageId === afgewezen.id;

  async function kiesFase(nieuweStageId: string) {
    if (nieuweStageId === stageId) return;
    setBezig(true);
    setFout(null);
    const res = await setApplicationStage(
      applicationId,
      nieuweStageId,
      vacancyId,
      candidateId
    );
    if (res?.error) setFout(res.error);
    setBezig(false);
  }

  async function wijsAf() {
    setBezig(true);
    setFout(null);
    const res = await rejectApplication(applicationId, vacancyId, candidateId);
    if (res?.error) setFout(res.error);
    setBezig(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={stageId} onValueChange={kiesFase} disabled={bezig}>
          <SelectTrigger
            size="sm"
            aria-label="Fase aanpassen"
            className="min-w-40 flex-1"
          >
            <SelectValue placeholder="Kies een fase" />
          </SelectTrigger>
          <SelectContent>
            {stages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: stage.color }}
                  aria-hidden
                />
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isAfgewezen && (
          <Button
            variant="outline"
            size="sm"
            onClick={wijsAf}
            disabled={bezig}
            className="text-danger-deep hover:bg-danger-soft"
          >
            {bezig ? <Loader2Icon className="animate-spin" /> : <XIcon />}
            Afwijzen
          </Button>
        )}
      </div>
      {fout && (
        <p role="alert" className="text-xs text-danger-deep">
          {fout}
        </p>
      )}
    </div>
  );
}
