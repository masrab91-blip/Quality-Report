import { requireManager } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/nav-bar";
import { DEFECT_TYPE_LABELS, PRIORITY_LABELS, STAGE_LABELS } from "@/lib/validation";

export default async function DashboardPage() {
  const session = await requireManager();

  const [byStage, byDefectType, byPriority, byVendor, creditTotal] = await Promise.all([
    prisma.report.groupBy({ by: ["stage"], _count: true }),
    prisma.report.groupBy({ by: ["defectType"], _count: true }),
    prisma.report.groupBy({ by: ["priority"], _count: true }),
    prisma.report.groupBy({ by: ["vendor"], _count: true, orderBy: { _count: { vendor: "desc" } }, take: 10 }),
    prisma.report.aggregate({ _sum: { creditAmount: true } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar session={session} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total credits issued" value={`$${(creditTotal._sum.creditAmount ?? 0).toString()}`} />
          {byStage.map((row) => (
            <StatCard key={row.stage} label={STAGE_LABELS[row.stage]} value={row._count.toString()} />
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <CountTable title="By defect type" rows={byDefectType.map((r) => ({ label: DEFECT_TYPE_LABELS[r.defectType], count: r._count }))} />
          <CountTable title="By priority" rows={byPriority.map((r) => ({ label: PRIORITY_LABELS[r.priority], count: r._count }))} />
          <CountTable
            title="Top vendors by report count"
            rows={byVendor.map((r) => ({ label: r.vendor ?? "(none)", count: r._count }))}
          />
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function CountTable({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {rows.map((r) => (
          <li key={r.label} className="flex justify-between border-b border-slate-100 py-1 last:border-0">
            <span className="text-slate-600">{r.label}</span>
            <span className="font-medium text-slate-900">{r.count}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-slate-400">No data yet.</li>}
      </ul>
    </div>
  );
}
