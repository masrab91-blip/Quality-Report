import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/nav-bar";
import { StageBadge, PriorityBadge } from "@/components/badges";

export default async function MyReportsPage() {
  const session = await verifySession();
  const reports = await prisma.report.findMany({
    where: { submittedById: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar session={session} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">My reports</h1>
          <Link href="/report/new" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            New report
          </Link>
        </div>

        {reports.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">You haven&apos;t submitted any reports yet.</p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Report #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/report/${r.id}`} className="font-medium text-blue-700 hover:underline">
                        {r.reportNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{r.customer}</td>
                    <td className="px-4 py-3">
                      <StageBadge stage={r.stage} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.createdAt.toLocaleDateString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
