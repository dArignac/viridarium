import { redirect } from "next/navigation";
import { checkInstanceBootstrapStatus, requireUser } from "@/src/lib/auth/guard";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const needsBootstrap = await checkInstanceBootstrapStatus();
  if (needsBootstrap) {
    redirect("/setup");
  }

  let sessionUser;
  try {
    sessionUser = await requireUser();
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌱</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Viridarium</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Logged in as <span className="font-medium text-zinc-700 dark:text-zinc-300">{sessionUser.email}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 uppercase tracking-wider">
              {sessionUser.role}
            </span>
            <LogoutButton />
          </div>
        </header>

        <main className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-lg font-semibold mb-1">Garden Care Cockpit</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Module <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">identity</code> is active and enforcing tenant isolation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <a
                href="/settings/2fa"
                className="block p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 transition group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold group-hover:text-emerald-600 transition">
                    Two-Factor Authentication
                  </span>
                  <span>🛡️</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Manage your authenticator app & backup recovery codes.
                </p>
              </a>

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">
                    Garden Inventory
                  </span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    Next Slice
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Sections, 2D grids, and botanical inventory arriving in Module 2.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
