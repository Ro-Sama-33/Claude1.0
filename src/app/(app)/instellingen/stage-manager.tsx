"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";

import {
  addStage,
  deleteStage,
  reorderStages,
  updateStage,
  type StageState,
} from "./actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type StageRow = {
  id: string;
  name: string;
  color: string;
  count: number;
};

function StageItem({
  stage,
  onDeleteRequest,
}: {
  stage: StageRow;
  onDeleteRequest: (stage: StageRow) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stage.id });
  const [naam, setNaam] = React.useState(stage.name);

  React.useEffect(() => setNaam(stage.name), [stage.name]);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card p-2",
        isDragging && "opacity-50 shadow-md"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground"
        aria-label={`Sleep ${stage.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" />
      </button>

      <input
        type="color"
        defaultValue={stage.color}
        aria-label={`Kleur van ${stage.name}`}
        className="size-7 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
        onBlur={(e) => {
          if (e.target.value.toLowerCase() !== stage.color.toLowerCase()) {
            void updateStage(stage.id, { color: e.target.value });
          }
        }}
      />

      <Input
        value={naam}
        onChange={(e) => setNaam(e.target.value)}
        onBlur={() => {
          const nieuw = naam.trim();
          if (nieuw && nieuw !== stage.name) {
            void updateStage(stage.id, { name: nieuw });
          } else if (!nieuw) {
            setNaam(stage.name);
          }
        }}
        className="h-8 flex-1"
        aria-label={`Naam van ${stage.name}`}
      />

      <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
        {stage.count} {stage.count === 1 ? "kandidaat" : "kandidaten"}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-danger-deep hover:bg-danger-soft"
        onClick={() => onDeleteRequest(stage)}
        aria-label={`Verwijder ${stage.name}`}
      >
        <Trash2Icon className="size-4" />
      </Button>
    </li>
  );
}

export function StageManager({ stages }: { stages: StageRow[] }) {
  const [items, setItems] = React.useState(stages);
  const [teVerwijderen, setTeVerwijderen] = React.useState<StageRow | null>(
    null
  );
  const [verwijderFout, setVerwijderFout] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => setItems(stages), [stages]);

  const [addState, addAction, addPending] = useActionState<StageState, FormData>(
    addStage,
    undefined
  );
  React.useEffect(() => {
    if (addState?.success) formRef.current?.reset();
  }, [addState]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      void reorderStages(next.map((s) => s.id));
      return next;
    });
  }

  async function bevestigVerwijderen() {
    if (!teVerwijderen) return;
    const res = await deleteStage(teVerwijderen.id);
    if (res?.error) {
      setVerwijderFout(res.error);
      return;
    }
    setTeVerwijderen(null);
    setVerwijderFout(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <DndContext
        id="pipeline-stages"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-2">
            {items.map((stage) => (
              <StageItem
                key={stage.id}
                stage={stage}
                onDeleteRequest={(s) => {
                  setVerwijderFout(null);
                  setTeVerwijderen(s);
                }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <form
        ref={formRef}
        action={addAction}
        className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed bg-muted/40 p-3"
      >
        <input
          type="color"
          name="color"
          defaultValue="#6B6580"
          aria-label="Kleur van de nieuwe fase"
          className="size-9 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
        />
        <Input
          name="name"
          placeholder="Naam van de nieuwe fase"
          className="h-9 min-w-40 flex-1"
          aria-label="Naam van de nieuwe fase"
        />
        <Button type="submit" disabled={addPending}>
          {addPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
          Fase toevoegen
        </Button>
        {addState?.error && (
          <p role="alert" className="w-full text-xs text-danger-deep">
            {addState.error}
          </p>
        )}
      </form>

      <AlertDialog
        open={teVerwijderen !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTeVerwijderen(null);
            setVerwijderFout(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fase verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              {verwijderFout
                ? verwijderFout
                : `De fase "${teVerwijderen?.name}" wordt verwijderd. Dit kan alleen als er geen kandidaten in staan.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            {!verwijderFout && (
              <AlertDialogAction
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  void bevestigVerwijderen();
                }}
              >
                Verwijderen
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
