"use client";

import { useTransition } from "react";
import { moveStageAction } from "@/lib/actions/reports";
import { STAGE_LABELS } from "@/lib/validation";
import type { Stage } from "@/generated/prisma/client";

export function StageSelect({ reportId, stage }: { reportId: string; stage: Stage }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={stage}
      disabled={isPending}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const next = e.target.value as Stage;
        startTransition(() => {
          void moveStageAction(reportId, next);
        });
      }}
      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs disabled:opacity-60"
    >
      {Object.entries(STAGE_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
