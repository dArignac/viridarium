"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plant } from "@/src/db/schema/inventory";
import { deletePlantAction } from "@/src/lib/inventory/actions";
import { PlantFormModal } from "./plant-form-modal";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  vegetable: { label: "Vegetable", emoji: "🥕" },
  herb: { label: "Herb", emoji: "🌿" },
  fruit_tree: { label: "Fruit Tree", emoji: "🍎" },
  shrub: { label: "Shrub", emoji: "🌳" },
  flower: { label: "Flower", emoji: "🌸" },
  other: { label: "Other", emoji: "🌱" },
};

export function PlantListClient({ plants }: { plants: Plant[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredPlants = plants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.species && p.species.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (plantId: string, plantName: string) => {
    if (!confirm(`Are you sure you want to remove "${plantName}"?`)) return;
    setDeletingId(plantId);
    try {
      await deletePlantAction(plantId);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search plants or species..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="absolute left-3 top-2.5 text-zinc-400 text-xs">🔍</span>
        </div>

        <button
          type="button"
          data-testid="add-plant-btn"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs cursor-pointer transition"
        >
          <span>➕</span> Add Plant
        </button>
      </div>

      {filteredPlants.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/40 dark:bg-zinc-900/40">
          <div className="text-4xl mb-2">🌿</div>
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            {search ? "No matching plants found" : "No plants registered yet"}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto mt-1 mb-4">
            {search
              ? "Try adjusting your search query."
              : "Register botanical varieties to organize watering intervals and place them on your garden grid."}
          </p>
          {!search && (
            <button
              type="button"
              data-testid="add-first-plant-btn"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-500 cursor-pointer"
            >
              Add First Plant
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlants.map((plant) => {
            let pruning: number[] = [];
            try {
              pruning = JSON.parse(plant.pruningMonths || "[]");
            } catch {
              pruning = [];
            }
            const catInfo =
              CATEGORY_LABELS[plant.category] || { label: plant.category, emoji: "🌱" };

            return (
              <div
                key={plant.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                        {catInfo.emoji}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                          {plant.name}
                        </h4>
                        {plant.species && (
                          <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
                            {plant.species}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={deletingId === plant.id}
                      onClick={() => handleDelete(plant.id, plant.name)}
                      className="text-zinc-400 hover:text-red-500 p-1 rounded-md text-xs transition cursor-pointer"
                      title="Delete plant"
                    >
                      🗑️
                    </button>
                  </div>

                  {plant.notes && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-3 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                      {plant.notes}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <span>💧</span> Water every:
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {plant.waterIntervalDays} days
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <span>⚠️</span> Pesticide safety:
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {plant.defaultPesticideWaitingDays} days
                    </span>
                  </div>

                  {pruning.length > 0 && (
                    <div className="pt-1">
                      <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                        ✂️ Pruning calendar:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {pruning.map((m) => (
                          <span
                            key={m}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          >
                            {MONTH_NAMES[m - 1]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PlantFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
