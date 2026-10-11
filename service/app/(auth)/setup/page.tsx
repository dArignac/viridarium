import { checkInstanceBootstrapStatus } from "@/src/lib/auth/guard";
import SetupForm from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const needsBootstrap = await checkInstanceBootstrapStatus();

  if (!needsBootstrap) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
          <h1 className="text-2xl font-bold mb-2">Setup Already Completed</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            An administrator account is already configured for this Viridarium instance.
          </p>
          <a
            href="/login"
            className="inline-block w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700 transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="text-center mb-6">
          <span className="text-3xl">🌱</span>
          <h1 className="text-2xl font-bold tracking-tight mt-2">Welcome to Viridarium</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Create the primary administrator account to bootstrap your garden instance.
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
