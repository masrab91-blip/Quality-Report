import "server-only";
import type { Prisma } from "@/generated/prisma/client";

const COUNTER_KEY = "report";

// Must be called from inside the same transaction as the Report row's
// creation, so a crashed submission never burns a number.
export async function nextReportNumber(tx: Prisma.TransactionClient): Promise<string> {
  const counter = await tx.counter.upsert({
    where: { id: COUNTER_KEY },
    update: { value: { increment: 1 } },
    create: { id: COUNTER_KEY, value: 1 },
  });
  return `QR-${String(counter.value).padStart(4, "0")}`;
}
