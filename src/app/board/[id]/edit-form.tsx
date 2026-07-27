"use client";

import { useActionState } from "react";
import { updateReportAction, type ActionState } from "@/lib/actions/reports";
import { DEFECT_TYPE_LABELS, PRIORITY_LABELS } from "@/lib/validation";
import type { Report } from "@/generated/prisma/client";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

function dateValue(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export function EditForm({ report }: { report: Report }) {
  const boundAction = updateReportAction.bind(null, report.id);
  const [state, action, pending] = useActionState<ActionState, FormData>(boundAction, undefined);

  return (
    <form action={action} className="space-y-6">
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold text-slate-800">Delivery details</legend>
        <div>
          <label className={labelClass} htmlFor="customer">
            Customer *
          </label>
          <input id="customer" name="customer" required defaultValue={report.customer} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="jobsite">
            Job site
          </label>
          <input id="jobsite" name="jobsite" defaultValue={report.jobsite ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="po">
            Sales order / PO #
          </label>
          <input id="po" name="po" defaultValue={report.po ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="vendor">
            Vendor / manufacturer
          </label>
          <input id="vendor" name="vendor" defaultValue={report.vendor ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="product">
            Product / SKU
          </label>
          <input id="product" name="product" defaultValue={report.product ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="colorLot">
            Color / style / lot #
          </label>
          <input id="colorLot" name="colorLot" defaultValue={report.colorLot ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="qty">
            Quantity affected
          </label>
          <input id="qty" name="qty" type="number" min={1} defaultValue={report.qty ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="defectType">
            Defect type *
          </label>
          <select id="defectType" name="defectType" required defaultValue={report.defectType} className={inputClass}>
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
          <select id="priority" name="priority" required defaultValue={report.priority} className={inputClass}>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="jobStopped"
          value="on"
          defaultChecked={report.jobStopped}
          className="h-4 w-4 rounded border-slate-300"
        />
        Job is stopped or delayed
      </label>

      <div>
        <label className={labelClass} htmlFor="description">
          Description *
        </label>
        <textarea id="description" name="description" required rows={4} defaultValue={report.description} className={inputClass} />
      </div>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold text-slate-800">Vendor claim / closeout</legend>
        <div>
          <label className={labelClass} htmlFor="reportedBy">
            Reported by
          </label>
          <input id="reportedBy" name="reportedBy" defaultValue={report.reportedBy ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="dateReported">
            Date reported
          </label>
          <input id="dateReported" name="dateReported" type="date" defaultValue={dateValue(report.dateReported)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="deliveryDate">
            Delivery date
          </label>
          <input id="deliveryDate" name="deliveryDate" type="date" defaultValue={dateValue(report.deliveryDate)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="bolNumber">
            BOL number
          </label>
          <input id="bolNumber" name="bolNumber" defaultValue={report.bolNumber ?? ""} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="rootCause">
            Root cause
          </label>
          <textarea id="rootCause" name="rootCause" rows={2} defaultValue={report.rootCause ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="investigatedBy">
            Investigated by
          </label>
          <input id="investigatedBy" name="investigatedBy" defaultValue={report.investigatedBy ?? ""} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="resolution">
            Resolution
          </label>
          <textarea id="resolution" name="resolution" rows={2} defaultValue={report.resolution ?? ""} className={inputClass} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="vendorClaimFiled"
            value="on"
            defaultChecked={report.vendorClaimFiled}
            className="h-4 w-4 rounded border-slate-300"
          />
          Vendor claim filed
        </label>
        <div>
          <label className={labelClass} htmlFor="claimRmaNumber">
            Claim / RMA #
          </label>
          <input id="claimRmaNumber" name="claimRmaNumber" defaultValue={report.claimRmaNumber ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="creditAmount">
            Credit amount ($)
          </label>
          <input
            id="creditAmount"
            name="creditAmount"
            type="number"
            step="0.01"
            min={0}
            defaultValue={report.creditAmount?.toString() ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="closedBy">
            Closed by
          </label>
          <input id="closedBy" name="closedBy" defaultValue={report.closedBy ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="dateClosed">
            Date closed
          </label>
          <input id="dateClosed" name="dateClosed" type="date" defaultValue={dateValue(report.dateClosed)} className={inputClass} />
        </div>
      </fieldset>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
