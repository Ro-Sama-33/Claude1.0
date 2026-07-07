"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2Icon, PencilIcon, Trash2Icon } from "lucide-react";

import {
  addNote,
  deleteNote,
  updateNote,
  type NoteFormState,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";

export type NoteView = {
  id: string;
  body: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  author: { full_name: string } | null;
};

function NoteItem({
  note,
  candidateId,
  isEigenNotitie,
}: {
  note: NoteView;
  candidateId: string;
  isEigenNotitie: boolean;
}) {
  const [bewerken, setBewerken] = React.useState(false);
  const [state, formAction, isPending] = useActionState<NoteFormState, FormData>(
    updateNote.bind(null, note.id, candidateId),
    undefined
  );

  React.useEffect(() => {
    if (state?.success) setBewerken(false);
  }, [state]);

  const auteur = note.author?.full_name?.trim() || "Onbekende recruiter";
  const bewerkt = note.updated_at !== note.created_at;

  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{auteur}</span> ·{" "}
          {formatDateTime(note.created_at)}
          {bewerkt && " · bewerkt"}
        </p>
        {isEigenNotitie && !bewerken && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setBewerken(true)}
            >
              <PencilIcon className="size-3.5" />
              <span className="sr-only">Notitie bewerken</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-danger-deep hover:bg-danger-soft"
              onClick={() => deleteNote(note.id, candidateId)}
            >
              <Trash2Icon className="size-3.5" />
              <span className="sr-only">Notitie verwijderen</span>
            </Button>
          </div>
        )}
      </div>

      {bewerken ? (
        <form action={formAction} className="flex flex-col gap-2">
          {state?.error && (
            <p role="alert" className="text-xs text-danger-deep">
              {state.error}
            </p>
          )}
          <Textarea name="body" defaultValue={note.body} rows={3} autoFocus />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setBewerken(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2Icon className="animate-spin" />}
              Opslaan
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm whitespace-pre-wrap">{note.body}</p>
      )}
    </li>
  );
}

export function NotesSection({
  candidateId,
  notes,
  currentUserId,
}: {
  candidateId: string;
  notes: NoteView[];
  currentUserId: string;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<NoteFormState, FormData>(
    addNote.bind(null, candidateId),
    undefined
  );

  React.useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-2 rounded-lg border bg-card p-4"
      >
        <label htmlFor="nieuwe-notitie" className="text-sm font-medium">
          Nieuwe notitie
        </label>
        {state?.error && (
          <p role="alert" className="text-xs text-danger-deep">
            {state.error}
          </p>
        )}
        <Textarea
          id="nieuwe-notitie"
          name="body"
          rows={3}
          placeholder="Bijv. gesproken over beschikbaarheid, wil graag 32 uur…"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending && <Loader2Icon className="animate-spin" />}
            Notitie toevoegen
          </Button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nog geen notities voor deze kandidaat.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              candidateId={candidateId}
              isEigenNotitie={note.created_by === currentUserId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
