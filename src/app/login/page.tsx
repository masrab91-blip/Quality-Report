import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo tagline="Manager sign in" />
          <p className="mt-2 text-sm text-slate-500">Sign in to manage quality issue reports.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
