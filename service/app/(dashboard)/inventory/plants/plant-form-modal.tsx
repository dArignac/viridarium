"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createPlantAction } from "@/src/lib/inventory/actions";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function PlantFormModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [category, setCategory] = useState<
    "vegetable" | "herb" | "fruit_tree" | "shrub" | "flower" | "other"
  >("vegetable");
  const [waterIntervalDays, setWaterIntervalDays] = useState(3);
  const [pruningMonths, setPruningMonths] = useState<number[]>([]);
  const [defaultPesticideWaitingDays, setDefaultPesticideWaitingDays] = useState(7);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleMonth = (month: number) => {
    setPruningMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createPlantAction({
        name,
        species: species || undefined,
        category,
        waterIntervalDays: Number(waterIntervalDays),
        pruningMonths,
        defaultPesticideWaitingDays: Number(defaultPesticideWaitingDays),
        notes: notes || undefined,
      });

      if (res.success) {
        setName("");
        setSpecies("");
        setPruningMonths([]);
        setNotes("");
        onClose();
        router.refresh();
      } else {
        setError(res.error || "Failed to create plant");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plant-modal-title"
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <h2 id="plant-modal-title" className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>🌱</span> Add New Botanical Plant
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 text-sm font-semibold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="plant-name">
              Plant Name *
            </label>
            <input
              id="plant-name"
              data-testid="plant-name-input"
              type="text"
              required
              placeholder="e.g. San Marzano Tomato"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="plant-species">
                Species / Variety
              </label>
              <input
                id="plant-species"
                data-testid="plant-species-input"
                type="text"
                placeholder="e.g. Solanum lycopersicum"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="plant-category">
                Category
              </label>
              <select
                id="plant-category"
                data-testid="plant-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="vegetable">🥕 Vegetable</option>
                <option value="herb">🌿 Herb</option>
                <option value="fruit_tree">🍎 Fruit Tree</option>
                <option value="shrub">🌳 Shrub</option>
                <option value="flower">🌸 Flower</option>
                <option value="other">🌱 Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="plant-water">
                Watering Interval (Days)
              </label>
              <input
                id="plant-water"
                type="number"
                min={1}
                max={365}
                value={waterIntervalDays}
                onChange={(e) => setWaterIntervalDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="plant-pesticide">
                Pesticide Waiting Period (Days)
              </label>
              <input
                id="plant-pesticide"
                type="number"
                min={0}
                max={90}
                value={defaultPesticideWaitingDays}
                onChange={(e) => setDefaultPesticideWaitingDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <span className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Pruning Months (Seasonal Calendar)
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {MONTH_NAMES.map((name, idx) => {
                const monthNum = idx + 1;
                const active = pruningMonths.includes(monthNum);
                return (
                  <button
                    type="button"
                    key={monthNum}
                    onClick={() => toggleMonth(monthNum)}
                    className={`py-1 text-center rounded text-xs font-medium cursor-pointer transition ${
                      active
                        ? "bg-emerald-600 text-white shadow-xs font-semibold"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="plant-notes">
              Notes & Care Details
            </label>
            <textarea
              id="plant-notes"
              rows={2}
              placeholder="e.g. Loves full sun, stake early."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="submit-plant-btn"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Plant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
