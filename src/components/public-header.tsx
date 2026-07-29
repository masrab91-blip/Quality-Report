import Link from "next/link";
import { Logo } from "@/components/logo";

export function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Logo />
        <Link href="/login" className="text-sm text-slate-500 hover:text-slate-800">
          Manager sign in
        </Link>
      </div>
    </header>
  );
}
