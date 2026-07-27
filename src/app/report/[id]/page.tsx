import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getPhotoUrl, isStorageConfigured } from "@/lib/storage";
import { NavBar } from "@/components/nav-bar";
import { StageBadge, PriorityBadge } from "@/components/badges";
import { DEFECT_TYPE_LABELS } from "@/lib/validation";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await verifySession();
  const report = await prisma.report.findUnique({ where: { id }, include: { photos: true } });

  if (!report) notFound();
  if (session.role === "MANAGER") redirect(`/board/${id}`);
  if (report.submittedById !== session.userId) notFound();

  const photoUrls = isStorageConfigured()
    ? await Promise.all(report.photos.map((p) => getPhotoUrl(p.key)))
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar session={session} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">{report.reportNumber}</h1>
          <StageBadge stage={report.stage} />
          <PriorityBadge priority={report.priority} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Submitted {report.createdAt.toLocaleString("en-US")} — this view is read-only after submission.
        </p>

        <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-sm">
          <DetailRow label="Customer" value={report.customer} />
          <DetailRow label="Job site" value={report.jobsite} />
          <DetailRow label="Sales order / PO #" value={report.po} />
          <DetailRow label="Vendor / manufacturer" value={report.vendor} />
          <DetailRow label="Product / SKU" value={report.product} />
          <DetailRow label="Color / style / lot #" value={report.colorLot} />
          <DetailRow label="Quantity affected" value={report.qty} />
          <DetailRow label="Defect type" value={DEFECT_TYPE_LABELS[report.defectType]} />
          <DetailRow label="Job stopped/delayed" value={report.jobStopped ? "Yes" : "No"} />
          <div>
            <p className="font-medium text-slate-700">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-600">{report.description}</p>
          </div>
          {report.notesSubmitted && (
            <div>
              <p className="font-medium text-slate-700">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-600">{report.notesSubmitted}</p>
            </div>
          )}
          {photoUrls.length > 0 && (
            <div>
              <p className="font-medium text-slate-700">Photos</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {photoUrls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="" className="h-32 w-full rounded-lg object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex gap-2">
      <span className="w-44 shrink-0 font-medium text-slate-700">{label}</span>
      <span className="text-slate-600">{value}</span>
    </div>
  );
}
