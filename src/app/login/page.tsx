import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-bold text-slate-800">Quality Report</h1>
          <p className="mt-1 text-sm text-slate-500">Belden Brick and Supply — sign in to continue.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
