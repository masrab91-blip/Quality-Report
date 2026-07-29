import Link from "next/link";
import { logoutAction } from "@/lib/auth-actions";
import type { SessionPayload } from "@/lib/session";
import { Logo } from "@/components/logo";

// Only managers ever see this — report submission needs no account.
export function NavBar({ session }: { session: SessionPayload }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/board">
            <Logo tagline="Quality Report — Manager Board" />
          </Link>
          <nav className="hidden gap-4 text-sm sm:flex">
            <Link href="/board" className="text-slate-600 hover:text-slate-900">
              Board
            </Link>
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/users" className="text-slate-600 hover:text-slate-900">
              Users
            </Link>
            <Link href="/report/new" className="text-slate-600 hover:text-slate-900">
              New report
            </Link>
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
