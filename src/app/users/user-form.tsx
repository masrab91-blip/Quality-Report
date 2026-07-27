"use client";

import { useActionState } from "react";
import { createUserAction, type CreateUserState } from "@/lib/actions/users";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

export function UserForm() {
  const [state, action, pending] = useActionState<CreateUserState, FormData>(createUserAction, undefined);

  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input name="name" placeholder="Full name" required className={inputClass} />
        <input name="email" type="email" placeholder="Email" required className={inputClass} />
        <select name="role" defaultValue="SUBMITTER" className={inputClass}>
          <option value="SUBMITTER">Submitter</option>
          <option value="MANAGER">Manager</option>
        </select>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.generatedPassword && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          Account created. Temporary password: <span className="font-mono font-semibold">{state.generatedPassword}</span>{" "}
          — share it securely; the user should sign in and it should be changed as soon as change-password is added.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
