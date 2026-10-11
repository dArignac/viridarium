import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/guard";
import { getPlants } from "@/src/lib/inventory/queries";
import { PlantListClient } from "./plant-list-client";

export const dynamic = "force-dynamic";

export default async function PlantsPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const plants = await getPlants(user.userId);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌿</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Botanical Plant Registry</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Manage plant species, watering intervals, and pruning schedules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/inventory"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              ← Garden Grid
            </Link>
            <Link
              href="/"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
            >
              Cockpit
            </Link>
          </div>
        </header>

        <main>
          <PlantListClient plants={plants} />
        </main>
      </div>
    </div>
  );
}
