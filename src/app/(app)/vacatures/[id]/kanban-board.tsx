"use client";

import * as React from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, MapPinIcon } from "lucide-react";

import { moveApplication } from "../actions";
import { Badge } from "@/components/ui/badge";
import { avgBadge, type AvgStatus } from "@/lib/avg";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type KanbanCard = {
  applicationId: string;
  candidateId: string;
  name: string;
  city: string | null;
  lastContact: string | null;
  avg: AvgStatus;
};

export type KanbanStage = {
  id: string;
  name: string;
  color: string;
};

type Columns = Record<string, KanbanCard[]>;

function CardBody({
  card,
  dragging,
}: {
  card: KanbanCard;
  dragging?: boolean;
}) {
  const badge = avgBadge[card.avg];
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 shadow-xs",
        dragging && "shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/kandidaten/${card.candidateId}`}
          className="text-sm font-medium hover:underline"
          // draggable=false: anders kaapt de native anchor-drag van de browser
          // de pointer en start dnd-kit z'n sleep niet (kaart beweegt niet).
          draggable={false}
          onClick={(e) => e.stopPropagation()}
        >
          {card.name}
        </Link>
        <GripVerticalIcon className="size-4 shrink-0 cursor-grab text-muted-foreground" />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {card.city && (
          <span className="inline-flex items-center gap-1">
            <MapPinIcon className="size-3" />
            {card.city}
          </span>
        )}
        <span>Laatst: {formatDate(card.lastContact)}</span>
      </div>
      <div className="mt-2">
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
    </div>
  );
}

function SortableCard({ card }: { card: KanbanCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.applicationId });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("touch-none", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <CardBody card={card} />
    </div>
  );
}

function Column({
  stage,
  cards,
}: {
  stage: KanbanStage;
  cards: KanbanCard[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: stage.color }}
          aria-hidden
        />
        <h2 className="text-sm font-semibold">{stage.name}</h2>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {cards.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 rounded-lg border border-dashed bg-muted/40 p-2 transition-colors",
          isOver && "border-ring bg-muted"
        )}
      >
        <SortableContext
          items={cards.map((c) => c.applicationId)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <SortableCard key={card.applicationId} card={card} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">
            Sleep hier een kandidaat naartoe
          </p>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  vacancyId,
  stages,
  initialColumns,
}: {
  vacancyId: string;
  stages: KanbanStage[];
  initialColumns: Columns;
}) {
  const [columns, setColumns] = React.useState<Columns>(initialColumns);
  const [activeCard, setActiveCard] = React.useState<KanbanCard | null>(null);

  // Serverdata is de bron van waarheid; sync bij nieuwe props (bijv. na koppelen).
  React.useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = React.useCallback(
    (id: string): string | undefined => {
      if (id in columns) return id;
      return Object.keys(columns).find((stageId) =>
        columns[stageId].some((c) => c.applicationId === id)
      );
    },
    [columns]
  );

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const container = findContainer(id);
    const card = container
      ? columns[container].find((c) => c.applicationId === id)
      : null;
    setActiveCard(card ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const from = findContainer(activeId);
    const to = findContainer(overId);
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const fromCards = prev[from];
      const toCards = prev[to];
      const moving = fromCards.find((c) => c.applicationId === activeId);
      if (!moving) return prev;

      const overIndex = toCards.findIndex((c) => c.applicationId === overId);
      const insertAt = overIndex >= 0 ? overIndex : toCards.length;

      return {
        ...prev,
        [from]: fromCards.filter((c) => c.applicationId !== activeId),
        [to]: [
          ...toCards.slice(0, insertAt),
          moving,
          ...toCards.slice(insertAt),
        ],
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const container = findContainer(overId) ?? findContainer(activeId);
    if (!container) return;

    let ordered: string[] = [];
    setColumns((prev) => {
      const cards = prev[container];
      const oldIndex = cards.findIndex((c) => c.applicationId === activeId);
      const newIndex = cards.findIndex((c) => c.applicationId === overId);
      const next =
        oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex
          ? arrayMove(cards, oldIndex, newIndex)
          : cards;
      ordered = next.map((c) => c.applicationId);
      return { ...prev, [container]: next };
    });

    // Persisteer de doelkolom (bevat de verplaatste kaart met de nieuwe fase).
    void moveApplication(vacancyId, container, ordered);
  }

  return (
    <DndContext
      id="kanban-board"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <Column
            key={stage.id}
            stage={stage}
            cards={columns[stage.id] ?? []}
          />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? <CardBody card={activeCard} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
