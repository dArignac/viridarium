import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/guard";
import {
  getPlants,
  getSections,
  getSectionWithGrid,
  getUnplacedPlants,
} from "@/src/lib/inventory/queries";
import { SectionManager } from "./section-manager";

export const dynamic = "force-dynamic";

interface InventoryPageProps {
  searchParams: Promise<{ sectionId?: string }>;
}

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const { sectionId } = await searchParams;
  const sections = await getSections(user.userId);

  let activeSectionId = sectionId;
  if (!activeSectionId && sections.length > 0) {
    activeSectionId = sections[0].id;
  }

  const activeGridState = activeSectionId
    ? await getSectionWithGrid(user.userId, activeSectionId)
    : null;

  const [unplacedPlants, allPlants] = await Promise.all([
    getUnplacedPlants(user.userId),
    getPlants(user.userId),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📐</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Garden 2D Inventory</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Spatial layout, landmarks, and botanical placements.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/inventory/plants"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              🌿 Plants Catalog
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
          <SectionManager
            sections={sections}
            activeGridState={activeGridState}
            unplacedPlants={unplacedPlants}
            allPlants={allPlants}
          />
        </main>
      </div>
    </div>
  );
}
