import { redirect } from "next/navigation";
import { checkInstanceBootstrapStatus } from "@/src/lib/auth/guard";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const needsBootstrap = await checkInstanceBootstrapStatus();
  if (needsBootstrap) {
    redirect("/setup");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="text-center mb-6">
          <span className="text-3xl">🌱</span>
          <h1 className="text-2xl font-bold tracking-tight mt-2">Sign in to Viridarium</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Access your garden cockpit and inventory.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
