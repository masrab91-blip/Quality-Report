import { isStorageConfigured } from "@/lib/storage";
import { PublicHeader } from "@/components/public-header";
import { IntakeForm } from "./intake-form";

// Open to anyone — no account required.
export default async function NewReportPage() {
  const storageConfigured = isStorageConfigured();

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-900">New quality issue report</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fill this out for any defective or damaged goods delivered to a customer. Marc is notified as soon as
          you submit.
        </p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <IntakeForm storageConfigured={storageConfigured} />
        </div>
      </main>
    </div>
  );
}
