import { notFound } from "next/navigation";
import { requireManager } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getPhotoUrl, isStorageConfigured } from "@/lib/storage";
import { NavBar } from "@/components/nav-bar";
import { StageBadge } from "@/components/badges";
import { StageSelect } from "@/components/stage-select";
import { EditForm } from "./edit-form";
import { NoteSection } from "./note-section";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireManager();

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      photos: true,
      submittedBy: true,
      auditLogs: { orderBy: { createdAt: "desc" }, include: { user: true } },
    },
  });
  if (!report) notFound();

  const photoUrls = isStorageConfigured()
    ? await Promise.all(report.photos.map((p) => getPhotoUrl(p.key)))
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar session={session} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">{report.reportNumber}</h1>
          <StageBadge stage={report.stage} />
          <StageSelect reportId={report.id} stage={report.stage} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Submitted by {report.submittedBy.name} on {report.createdAt.toLocaleString("en-US")}
        </p>

        {photoUrls.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {photoUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL, not a next/image-optimizable source */}
                <img src={url} alt="" className="h-28 w-full rounded-lg object-cover" />
              </a>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <EditForm report={report} />
        </div>

        <div className="mt-6 space-y-4">
          <NoteSection reportId={report.id} stage="submitted" title="Submitted notes" existingNotes={report.notesSubmitted} />
          <NoteSection reportId={report.id} stage="reviewed" title="Reviewed notes" existingNotes={report.notesReviewed} />
          <NoteSection reportId={report.id} stage="resolved" title="Resolved notes" existingNotes={report.notesResolved} />
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Audit log</h2>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            {report.auditLogs.map((log) => (
              <li key={log.id} className="border-b border-slate-100 pb-2 last:border-0">
                <span className="font-medium text-slate-800">{log.user.name}</span>{" "}
                {describeAudit(log.action, log.field)}
                {log.field && log.action === "field_updated" && (
                  <span className="text-slate-500">
                    {" "}
                    ({log.oldValue ?? "—"} → {log.newValue ?? "—"})
                  </span>
                )}
                <span className="ml-2 text-slate-400">{log.createdAt.toLocaleString("en-US")}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

const FIELD_LABELS: Record<string, string> = {
  customer: "customer",
  jobsite: "job site",
  po: "PO #",
  vendor: "vendor",
  product: "product",
  colorLot: "color/lot #",
  qty: "quantity",
  defectType: "defect type",
  priority: "priority",
  jobStopped: "job stopped",
  description: "description",
  reportedBy: "reported by",
  dateReported: "date reported",
  deliveryDate: "delivery date",
  bolNumber: "BOL number",
  rootCause: "root cause",
  investigatedBy: "investigated by",
  resolution: "resolution",
  vendorClaimFiled: "vendor claim filed",
  claimRmaNumber: "claim/RMA #",
  creditAmount: "credit amount",
  closedBy: "closed by",
  dateClosed: "date closed",
  notesSubmitted: "submitted",
  notesReviewed: "reviewed",
  notesResolved: "resolved",
};

function describeAudit(action: string, field: string | null): string {
  const label = field ? (FIELD_LABELS[field] ?? field) : field;
  switch (action) {
    case "created":
      return "created the report";
    case "stage_changed":
      return "changed the stage";
    case "field_updated":
      return `updated ${label}`;
    case "note_added":
      return `added a ${label} note`;
    case "photo_added":
      return "added a photo";
    default:
      return action;
  }
}
