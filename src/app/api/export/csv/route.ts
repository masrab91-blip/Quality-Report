import { requireManager } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { DEFECT_TYPE_LABELS, PRIORITY_LABELS, STAGE_LABELS } from "@/lib/validation";

const COLUMNS = [
  "Report #",
  "Stage",
  "Customer",
  "Job Site",
  "PO / Sales Order #",
  "Vendor",
  "Product / SKU",
  "Color / Lot #",
  "Qty Affected",
  "Defect Type",
  "Priority",
  "Job Stopped",
  "Description",
  "Reported By",
  "Date Reported",
  "Delivery Date",
  "BOL Number",
  "Root Cause",
  "Investigated By",
  "Resolution",
  "Vendor Claim Filed",
  "Claim / RMA #",
  "Credit Amount",
  "Closed By",
  "Date Closed",
  "Notes (Submitted)",
  "Notes (Reviewed)",
  "Notes (Resolved)",
  "Created At",
  "Updated At",
] as const;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function isoDate(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export async function GET() {
  await requireManager();

  const reports = await prisma.report.findMany({ orderBy: { createdAt: "asc" } });

  const rows = reports.map((r) => [
    r.reportNumber,
    STAGE_LABELS[r.stage],
    r.customer,
    r.jobsite,
    r.po,
    r.vendor,
    r.product,
    r.colorLot,
    r.qty,
    DEFECT_TYPE_LABELS[r.defectType],
    PRIORITY_LABELS[r.priority],
    r.jobStopped ? "Yes" : "No",
    r.description,
    r.reportedBy,
    isoDate(r.dateReported),
    isoDate(r.deliveryDate),
    r.bolNumber,
    r.rootCause,
    r.investigatedBy,
    r.resolution,
    r.vendorClaimFiled ? "Yes" : "No",
    r.claimRmaNumber,
    r.creditAmount?.toString() ?? "",
    r.closedBy,
    isoDate(r.dateClosed),
    r.notesSubmitted,
    r.notesReviewed,
    r.notesResolved,
    r.createdAt.toISOString(),
    r.updatedAt.toISOString(),
  ]);

  const csv = [COLUMNS.join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="quality-reports-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
