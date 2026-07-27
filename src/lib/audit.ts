import "server-only";
import type { Prisma } from "@/generated/prisma/client";

export type AuditAction =
  | "created"
  | "field_updated"
  | "stage_changed"
  | "note_added"
  | "photo_added";

// Append-only by convention: nothing elsewhere in the codebase updates or
// deletes an AuditLog row. Quality complaints can become evidence in vendor
// claims/customer disputes, so the record of who-changed-what must be durable.
export async function logAudit(
  tx: Prisma.TransactionClient,
  entry: {
    reportId: string;
    userId: string;
    action: AuditAction;
    field?: string;
    oldValue?: string | null;
    newValue?: string | null;
  },
) {
  await tx.auditLog.create({
    data: {
      reportId: entry.reportId,
      userId: entry.userId,
      action: entry.action,
      field: entry.field,
      oldValue: entry.oldValue ?? null,
      newValue: entry.newValue ?? null,
    },
  });
}
