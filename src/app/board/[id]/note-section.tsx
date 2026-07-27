"use client";

import { useActionState } from "react";
import { addNoteAction, type ActionState } from "@/lib/actions/reports";

export function NoteSection({
  reportId,
  stage,
  title,
  existingNotes,
}: {
  reportId: string;
  stage: "submitted" | "reviewed" | "resolved";
  title: string;
  existingNotes: string | null;
}) {
  const boundAction = addNoteAction.bind(null, reportId, stage);
  const [state, action, pending] = useActionState<ActionState, FormData>(boundAction, undefined);

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {existingNotes ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{existingNotes}</p>
      ) : (
        <p className="mt-2 text-sm text-slate-400">No notes yet.</p>
      )}
      <form action={action} className="mt-3 flex gap-2">
        <input
          name="note"
          placeholder="Add a note…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Add
        </button>
      </form>
      {state?.error && <p className="mt-1 text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
