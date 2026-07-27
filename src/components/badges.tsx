import { PRIORITY_LABELS, STAGE_LABELS } from "@/lib/validation";
import type { Priority, Stage } from "@/generated/prisma/client";

const PRIORITY_STYLES: Record<Priority, string> = {
  HIGH: "bg-red-100 text-red-800",
  MEDIUM: "bg-amber-100 text-amber-800",
  LOW: "bg-slate-100 text-slate-700",
};

const STAGE_STYLES: Record<Stage, string> = {
  SUBMITTED: "bg-blue-100 text-blue-800",
  REVIEWED: "bg-purple-100 text-purple-800",
  RESOLVED: "bg-green-100 text-green-800",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_STYLES[stage]}`}>
      {STAGE_LABELS[stage]}
    </span>
  );
}
