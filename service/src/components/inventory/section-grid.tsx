"use client";

import React, { useMemo } from "react";
import type { Landmark } from "@/src/db/schema/inventory";
import type { PlacedPlantItem } from "@/src/lib/inventory/queries";

export interface SectionGridProps {
  width: number;
  height: number;
  landmarks?: Landmark[];
  placements?: PlacedPlantItem[];
  selectedCoord?: { x: number; y: number } | null;
  onSelectCell?: (info: {
    x: number;
    y: number;
    placement?: PlacedPlantItem;
    landmark?: Landmark;
  }) => void;
  className?: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  vegetable: "🥕",
  herb: "🌿",
  fruit_tree: "🍎",
  shrub: "🌳",
  flower: "🌸",
  other: "🌱",
};

export function SectionGrid({
  width,
  height,
  landmarks = [],
  placements = [],
  selectedCoord,
  onSelectCell,
  className = "",
}: SectionGridProps) {
  // Map of "x,y" => PlacedPlantItem
  const placementMap = useMemo(() => {
    const map = new Map<string, PlacedPlantItem>();
    for (const p of placements) {
      map.set(`${p.x},${p.y}`, p);
    }
    return map;
  }, [placements]);

  // Helper to find landmark covering (x, y)
  const getLandmarkAt = (x: number, y: number): Landmark | undefined => {
    return landmarks.find((lm) => {
      if (lm.shape === "circle") {
        const radius = lm.radius ?? 1;
        const dist = Math.hypot(x - lm.x, y - lm.y);
        return dist <= radius;
      }
      // Default: rect
      const w = lm.width ?? 1;
      const h = lm.height ?? 1;
      return x >= lm.x && x < lm.x + w && y >= lm.y && y < lm.y + h;
    });
  };

  // Generate grid rows and columns
  const rows = Array.from({ length: height }, (_, y) => y);
  const cols = Array.from({ length: width }, (_, x) => x);

  return (
    <div className={`overflow-x-auto overflow-y-auto max-w-full p-2 ${className}`}>
      <div
        className="inline-block border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 bg-zinc-100/60 dark:bg-zinc-900/60 shadow-inner select-none"
        role="grid"
        aria-label="Garden 2D Grid"
      >
        {/* Column Headers (X coordinates) */}
        <div className="flex">
          <div className="w-8 h-6 flex-shrink-0" />
          {cols.map((x) => (
            <div
              key={`col-${x}`}
              className="w-11 sm:w-12 h-6 flex items-center justify-center text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-semibold flex-shrink-0"
            >
              {x}
            </div>
          ))}
        </div>

        {/* Rows with Y coordinate and cells */}
        {rows.map((y) => (
          <div key={`row-${y}`} className="flex items-center">
            {/* Row Header (Y coordinate) */}
            <div className="w-8 h-11 sm:h-12 flex items-center justify-center text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-semibold flex-shrink-0">
              {y}
            </div>

            {/* Cells */}
            {cols.map((x) => {
              const key = `${x},${y}`;
              const placement = placementMap.get(key);
              const landmark = getLandmarkAt(x, y);
              const isSelected =
                selectedCoord?.x === x && selectedCoord?.y === y;
              const isLandmarkOrigin =
                landmark && landmark.x === x && landmark.y === y;

              const plantEmoji = placement
                ? CATEGORY_EMOJI[placement.plant.category] || "🌱"
                : null;

              return (
                <button
                  type="button"
                  key={key}
                  data-testid={`grid-cell-${x}-${y}`}
                  aria-label={`Cell (${x}, ${y})${
                    placement ? `: ${placement.plant.name}` : ""
                  }${landmark ? ` in ${landmark.name}` : ""}`}
                  onClick={() =>
                    onSelectCell?.({ x, y, placement, landmark })
                  }
                  style={
                    landmark?.color
                      ? { backgroundColor: `${landmark.color}25` }
                      : undefined
                  }
                  className={`
                    w-11 h-11 sm:w-12 sm:h-12 m-0.5 rounded-md border flex flex-col items-center justify-center relative transition-all text-xs
                    flex-shrink-0 focus:outline-none cursor-pointer
                    ${
                      isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-400 dark:ring-emerald-500 z-10 scale-105 bg-emerald-50 dark:bg-emerald-950/60 shadow-md"
                        : landmark
                        ? "border-zinc-400 dark:border-zinc-600 hover:border-zinc-500"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }
                  `}
                >
                  {/* Landmark label overlay if origin */}
                  {isLandmarkOrigin && !placement && (
                    <span
                      className="absolute inset-x-0 top-0.5 text-[8px] font-medium truncate px-0.5 text-zinc-700 dark:text-zinc-300 opacity-90 leading-tight"
                      title={landmark.name}
                    >
                      {landmark.name}
                    </span>
                  )}

                  {/* Plant Icon & Label */}
                  {placement ? (
                    <div className="flex flex-col items-center justify-center w-full px-0.5">
                      <span className="text-base sm:text-lg leading-none" role="img" aria-label={placement.plant.category}>
                        {plantEmoji}
                      </span>
                      <span className="text-[8px] font-medium truncate w-full text-center text-zinc-800 dark:text-zinc-200 leading-tight mt-0.5">
                        {placement.plant.name}
                      </span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
