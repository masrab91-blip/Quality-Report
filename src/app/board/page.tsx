import Link from "next/link";
import { requireManager } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/nav-bar";
import { PriorityBadge } from "@/components/badges";
import { StageSelect } from "@/components/stage-select";
import { DEFECT_TYPE_LABELS, STAGE_LABELS, STAGE_ORDER } from "@/lib/validation";
import { formatDate } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await requireManager();
  const params = await searchParams;

  const where: Prisma.ReportWhereInput = {};
  if (params.vendor) where.vendor = { contains: params.vendor, mode: "insensitive" };
  if (params.defectType) where.defectType = params.defectType as Prisma.ReportWhereInput["defectType"];
  if (params.priority) where.priority = params.priority as Prisma.ReportWhereInput["priority"];
  if (params.q) {
    where.OR = [
      { customer: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
      { reportNumber: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const reports = await prisma.report.findMany({ where, orderBy: { createdAt: "desc" } });
  const byStage = Object.fromEntries(STAGE_ORDER.map((s) => [s, reports.filter((r) => r.stage === s)]));

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar session={session} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-900">Board</h1>
          <div className="flex gap-2">
            <Link href="/dashboard" className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
              Dashboard
            </Link>
            <a
              href="/api/export/csv"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            >
              Export CSV
            </a>
          </div>
        </div>

        <form className="mt-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search customer, description, report #"
            className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            name="vendor"
            defaultValue={params.vendor}
            placeholder="Vendor"
            className="w-40 rounded-lg border border-slate-300 px-3 py-2"
          />
          <select name="defectType" defaultValue={params.defectType ?? ""} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">All defect types</option>
            {Object.entries(DEFECT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select name="priority" defaultValue={params.priority ?? ""} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">All priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <button type="submit" className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">
            Filter
          </button>
          {(params.q || params.vendor || params.defectType || params.priority) && (
            <Link href="/board" className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50">
              Clear
            </Link>
          )}
        </form>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {STAGE_ORDER.map((stage) => (
            <div key={stage} className="rounded-xl border border-slate-200 bg-slate-100/60 p-3">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {STAGE_LABELS[stage]} ({byStage[stage].length})
              </h2>
              <div className="space-y-3">
                {byStage[stage].map((report) => (
                  <Link
                    key={report.id}
                    href={`/board/${report.id}`}
                    className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-blue-400"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{report.reportNumber}</span>
                      <PriorityBadge priority={report.priority} />
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{report.customer}</p>
                    <p className="text-xs text-slate-500">{DEFECT_TYPE_LABELS[report.defectType]}</p>
                    {report.jobStopped && (
                      <p className="mt-1 text-xs font-medium text-red-700">⚠ Job stopped</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{formatDate(report.createdAt)}</span>
                      <StageSelect reportId={report.id} stage={report.stage} />
                    </div>
                  </Link>
                ))}
                {byStage[stage].length === 0 && <p className="text-sm text-slate-400">No reports.</p>}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
