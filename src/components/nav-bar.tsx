import Link from "next/link";
import { logoutAction } from "@/lib/auth-actions";
import type { SessionPayload } from "@/lib/session";

export function NavBar({ session }: { session: SessionPayload | { userId: string; email: string; name: string; role: string } }) {
  const isManager = session.role === "MANAGER";
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href={isManager ? "/board" : "/report/new"} className="font-bold text-slate-800">
            Quality Report
          </Link>
          <nav className="hidden gap-4 text-sm sm:flex">
            <Link href="/report/new" className="text-slate-600 hover:text-slate-900">
              New report
            </Link>
            {!isManager && (
              <Link href="/report/mine" className="text-slate-600 hover:text-slate-900">
                My reports
              </Link>
            )}
            {isManager && (
              <>
                <Link href="/board" className="text-slate-600 hover:text-slate-900">
                  Board
                </Link>
                <Link href="/users" className="text-slate-600 hover:text-slate-900">
                  Users
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="hidden sm:inline">{session.name}</span>
          <form action={logoutAction}>
            <button type="submit" className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-100">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
