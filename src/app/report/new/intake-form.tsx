"use client";

import { useActionState } from "react";
import { createReportAction, type ActionState } from "@/lib/actions/reports";
import { DEFECT_TYPE_LABELS, PRIORITY_LABELS } from "@/lib/validation";
import { PhotoUploader } from "@/components/photo-uploader";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export function IntakeForm({ storageConfigured }: { storageConfigured: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createReportAction, undefined);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className={labelClass} htmlFor="reportedBy">
          Your name *
        </label>
        <input id="reportedBy" name="reportedBy" required className={inputClass} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="customer">
            Customer *
          </label>
          <input id="customer" name="customer" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="jobsite">
            Job site / delivery address
          </label>
          <input id="jobsite" name="jobsite" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="po">
            Sales order / PO #
          </label>
          <input id="po" name="po" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="vendor">
            Vendor / manufacturer
          </label>
          <input id="vendor" name="vendor" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="product">
            Product / SKU
          </label>
          <input id="product" name="product" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="colorLot">
            Color / style / lot #
          </label>
          <input id="colorLot" name="colorLot" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="qty">
            Quantity affected
          </label>
          <input id="qty" name="qty" type="number" min={1} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="defectType">
            Defect type *
          </label>
          <select id="defectType" name="defectType" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Select…
            </option>
            {Object.entries(DEFECT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="priority">
            Priority *
          </label>
          <select id="priority" name="priority" required className={inputClass} defaultValue="MEDIUM">
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="jobStopped" value="on" className="h-4 w-4 rounded border-slate-300" />
        Job is stopped or delayed because of this issue
      </label>

      <div>
        <label className={labelClass} htmlFor="description">
          Description *
        </label>
        <textarea id="description" name="description" required rows={4} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Additional notes (optional)
        </label>
        <textarea id="notes" name="notes" rows={2} className={inputClass} />
      </div>

      <div>
        <span className={labelClass}>Photos</span>
        <PhotoUploader storageConfigured={storageConfigured} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Submitting…" : "Submit report"}
      </button>
    </form>
  );
}
