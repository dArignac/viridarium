"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Landmark, Plant, Section } from "@/src/db/schema/inventory";
import type { PlacedPlantItem, SectionGridState } from "@/src/lib/inventory/queries";
import {
  createLandmarkAction,
  createSectionAction,
  deleteLandmarkAction,
  deleteSectionAction,
  movePlantAction,
  placePlantAction,
  removePlacementAction,
} from "@/src/lib/inventory/actions";
import { SectionGrid } from "@/src/components/inventory/section-grid";

export interface SectionManagerProps {
  sections: Section[];
  activeGridState: SectionGridState | null;
  unplacedPlants: Plant[];
  allPlants: Plant[];
}

const LANDMARK_COLORS = [
  { label: "Slate", value: "#64748b" },
  { label: "Emerald", value: "#15803d" },
  { label: "Sky", value: "#0284c7" },
  { label: "Amber", value: "#b45309" },
  { label: "Stone", value: "#78716c" },
];

export function SectionManager({
  sections,
  activeGridState,
  unplacedPlants,
  allPlants,
}: SectionManagerProps) {
  const router = useRouter();

  // Modals & Panels
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isLandmarkModalOpen, setIsLandmarkModalOpen] = useState(false);
  const [isMovingPlant, setIsMovingPlant] = useState<PlacedPlantItem | null>(null);

  // Selected cell state
  const [selectedCoord, setSelectedCoord] = useState<{
    x: number;
    y: number;
    placement?: PlacedPlantItem;
    landmark?: Landmark;
  } | null>(null);

  // New section form
  const [newSecName, setNewSecName] = useState("");
  const [newSecWidth, setNewSecWidth] = useState(12);
  const [newSecHeight, setNewSecHeight] = useState(12);

  // New landmark form
  const [lmName, setLmName] = useState("");
  const [lmShape, setLmShape] = useState<"rect" | "circle">("rect");
  const [lmX, setLmX] = useState(0);
  const [lmY, setLmY] = useState(0);
  const [lmWidth, setLmWidth] = useState(2);
  const [lmHeight, setLmHeight] = useState(2);
  const [lmRadius, setLmRadius] = useState(1);
  const [lmColor, setLmColor] = useState("#64748b");

  // Plant placement form
  const [selectedPlantIdToPlace, setSelectedPlantIdToPlace] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const section = activeGridState?.section;
  const landmarks = activeGridState?.landmarks || [];
  const placements = activeGridState?.placements || [];

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await createSectionAction({
        name: newSecName,
        width: Number(newSecWidth),
        height: Number(newSecHeight),
      });
      if (res.success && res.section) {
        setIsSectionModalOpen(false);
        setNewSecName("");
        router.push(`/inventory?sectionId=${res.section.id}`);
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to create section");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!section) return;
    if (!confirm(`Delete section "${section.name}" and all placed items?`)) return;
    setActionLoading(true);
    try {
      await deleteSectionAction(section.id);
      setSelectedCoord(null);
      router.push("/inventory");
      router.refresh();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateLandmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!section) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await createLandmarkAction({
        sectionId: section.id,
        name: lmName,
        shape: lmShape,
        x: Number(lmX),
        y: Number(lmY),
        width: lmShape === "rect" ? Number(lmWidth) : undefined,
        height: lmShape === "rect" ? Number(lmHeight) : undefined,
        radius: lmShape === "circle" ? Number(lmRadius) : undefined,
        color: lmColor,
      });
      if (res.success) {
        setIsLandmarkModalOpen(false);
        setLmName("");
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to create landmark");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLandmark = async (landmarkId: string) => {
    if (!confirm("Remove this landmark?")) return;
    setActionLoading(true);
    try {
      await deleteLandmarkAction(landmarkId);
      setSelectedCoord(null);
      router.refresh();
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlacePlant = async () => {
    if (!section || !selectedCoord || !selectedPlantIdToPlace) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await placePlantAction({
        sectionId: section.id,
        plantId: selectedPlantIdToPlace,
        x: selectedCoord.x,
        y: selectedCoord.y,
      });
      setSelectedPlantIdToPlace("");
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to place plant");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePlacement = async (placementId: string) => {
    setActionLoading(true);
    try {
      await removePlacementAction(placementId);
      setSelectedCoord(null);
      router.refresh();
    } finally {
      setActionLoading(false);
    }
  };

  const handleMovePlant = async (targetX: number, targetY: number) => {
    if (!isMovingPlant) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await movePlantAction({
        placementId: isMovingPlant.id,
        x: targetX,
        y: targetY,
      });
      setIsMovingPlant(null);
      setSelectedCoord(null);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to move plant");
    } finally {
      setActionLoading(false);
    }
  };

  const onCellClicked = (cellInfo: {
    x: number;
    y: number;
    placement?: PlacedPlantItem;
    landmark?: Landmark;
  }) => {
    if (isMovingPlant) {
      // User is in "move" mode, clicking target cell
      handleMovePlant(cellInfo.x, cellInfo.y);
      return;
    }
    setSelectedCoord(cellInfo);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Section Picker, Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-3">
          <label htmlFor="section-select" className="text-xs font-semibold text-zinc-500 uppercase">
            Section:
          </label>
          <select
            id="section-select"
            value={section?.id || ""}
            onChange={(e) => {
              setSelectedCoord(null);
              router.push(`/inventory?sectionId=${e.target.value}`);
            }}
            className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.width}×{s.height})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsSectionModalOpen(true)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            title="Create new section"
          >
            ➕ New
          </button>
        </div>

        <div className="flex items-center gap-2">
          {section && (
            <>
              <button
                type="button"
                data-testid="add-landmark-btn"
                onClick={() => {
                  setLmX(selectedCoord?.x || 0);
                  setLmY(selectedCoord?.y || 0);
                  setIsLandmarkModalOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer transition"
              >
                📐 Add Landmark
              </button>

              <button
                type="button"
                onClick={handleDeleteSection}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer transition"
                title="Delete current section"
              >
                Delete Section
              </button>
            </>
          )}

          <Link
            href="/inventory/plants"
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition"
          >
            🌿 Plant Catalog
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 text-xs bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl">
          {errorMessage}
        </div>
      )}

      {isMovingPlant && (
        <div className="p-3 text-xs bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 rounded-xl flex items-center justify-between">
          <span>
            Moving <strong>{isMovingPlant.plant.name}</strong>: Tap an unoccupied cell on the grid to place it.
          </span>
          <button
            type="button"
            onClick={() => setIsMovingPlant(null)}
            className="px-2 py-1 bg-amber-200 dark:bg-amber-800 rounded font-semibold text-[11px] cursor-pointer"
          >
            Cancel Move
          </button>
        </div>
      )}

      {/* Main Grid & Inspection Layout */}
      {sections.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md mx-auto space-y-4">
          <div className="text-4xl">🏡</div>
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">No Garden Sections Yet</h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Create your first garden plot, raised bed, or greenhouse to start placing plants on an abstracted 2D grid.
          </p>
          <button
            type="button"
            data-testid="create-first-section-btn"
            onClick={() => setIsSectionModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
          >
            ➕ Create Garden Section
          </button>
        </div>
      ) : section ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* 2D Grid Canvas */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 px-2">
              <div>
                <h3
                  data-testid="section-title"
                  className="font-bold text-sm text-zinc-900 dark:text-zinc-100"
                >
                  {section.name}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {section.width}×{section.height} integer grid • Tap any cell to inspect or plant
                </p>
              </div>
              <div className="text-[11px] text-zinc-400">
                {placements.length} planted • {landmarks.length} landmarks
              </div>
            </div>

            <SectionGrid
              width={section.width}
              height={section.height}
              landmarks={landmarks}
              placements={placements}
              selectedCoord={selectedCoord}
              onSelectCell={onCellClicked}
            />
          </div>

          {/* Cell Inspection Drawer / Sidebar */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center justify-between">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {selectedCoord
                  ? `Cell (${selectedCoord.x}, ${selectedCoord.y})`
                  : "Cell Inspector"}
              </h4>
              {selectedCoord && (
                <button
                  type="button"
                  onClick={() => setSelectedCoord(null)}
                  className="text-zinc-400 hover:text-zinc-600 text-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {!selectedCoord ? (
              <div className="text-center py-8 text-zinc-500 text-xs space-y-2">
                <span className="text-2xl block">👆</span>
                <p>Tap any cell on the grid to view details, place a plant, or inspect landmarks.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Placed Plant Details */}
                {selectedCoord.placement ? (
                  <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🌱</span>
                        <div>
                          <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {selectedCoord.placement.plant.name}
                          </div>
                          {selectedCoord.placement.plant.species && (
                            <div className="text-[11px] italic text-zinc-500">
                              {selectedCoord.placement.plant.species}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {selectedCoord.placement.plant.category}
                      </span>
                    </div>

                    <div className="space-y-1 text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                      <div>💧 Water every: {selectedCoord.placement.plant.waterIntervalDays} days</div>
                      <div>⚠️ Pesticide safety: {selectedCoord.placement.plant.defaultPesticideWaitingDays} days</div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsMovingPlant(selectedCoord.placement!)}
                        className="flex-1 py-1.5 px-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 rounded-lg font-semibold text-center cursor-pointer transition"
                      >
                        Move
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePlacement(selectedCoord.placement!.id)}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 px-3 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-700 dark:text-red-300 rounded-lg font-semibold text-center cursor-pointer transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty cell: Plant Placement Option */
                  <div className="space-y-3">
                    <h5 className="font-semibold text-zinc-800 dark:text-zinc-200">
                      Place a Plant Here
                    </h5>

                    {unplacedPlants.length === 0 && allPlants.length === 0 ? (
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-center space-y-2">
                        <p className="text-zinc-500">No plants available in your catalog.</p>
                        <Link
                          href="/inventory/plants"
                          className="inline-block px-3 py-1 bg-emerald-600 text-white rounded font-semibold text-xs"
                        >
                          Create a Plant
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <select
                          data-testid="select-plant-to-place"
                          value={selectedPlantIdToPlace}
                          onChange={(e) => setSelectedPlantIdToPlace(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs"
                        >
                          <option value="">-- Select Plant to Place --</option>
                          {unplacedPlants.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.category})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          data-testid="submit-place-plant-btn"
                          onClick={handlePlacePlant}
                          disabled={!selectedPlantIdToPlace || actionLoading}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs cursor-pointer disabled:opacity-50 transition"
                        >
                          {actionLoading ? "Placing..." : "Place Plant on Cell"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Landmark info on this cell */}
                {selectedCoord.landmark && (
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl space-y-2 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-xs inline-block"
                          style={{ backgroundColor: selectedCoord.landmark.color || "#64748b" }}
                        />
                        {selectedCoord.landmark.name}
                      </div>
                      <span className="text-[10px] uppercase font-mono text-zinc-500">
                        {selectedCoord.landmark.shape}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteLandmark(selectedCoord.landmark!.id)}
                      disabled={actionLoading}
                      className="text-red-500 hover:text-red-600 text-[11px] font-semibold cursor-pointer"
                    >
                      Delete Landmark
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* New Section Modal */}
      {isSectionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Create Garden Section
            </h3>
            <form onSubmit={handleCreateSection} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Section Name *
                </label>
                <input
                  type="text"
                  required
                  data-testid="section-name-input"
                  placeholder="e.g. Raised Beds"
                  value={newSecName}
                  onChange={(e) => setNewSecName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                    Width (cols)
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={30}
                    data-testid="section-width-input"
                    value={newSecWidth}
                    onChange={(e) => setNewSecWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                    Height (rows)
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={30}
                    data-testid="section-height-input"
                    value={newSecHeight}
                    onChange={(e) => setNewSecHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  data-testid="submit-section-btn"
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Landmark Modal */}
      {isLandmarkModalOpen && section && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Add Landmark to {section.name}
            </h3>
            <form onSubmit={handleCreateLandmark} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  data-testid="landmark-name-input"
                  placeholder="e.g. Shed, Compost, Water Spigot"
                  value={lmName}
                  onChange={(e) => setLmName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                    Shape
                  </label>
                  <select
                    value={lmShape}
                    onChange={(e) => setLmShape(e.target.value as "rect" | "circle")}
                    className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs"
                  >
                    <option value="rect">Rectangle</option>
                    <option value="circle">Circle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                    Color
                  </label>
                  <select
                    value={lmColor}
                    onChange={(e) => setLmColor(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs"
                  >
                    {LANDMARK_COLORS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                    X Coordinate
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={section.width - 1}
                    value={lmX}
                    onChange={(e) => setLmX(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                    Y Coordinate
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={section.height - 1}
                    value={lmY}
                    onChange={(e) => setLmY(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs"
                  />
                </div>
              </div>

              {lmShape === "rect" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                      Width (cols)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={section.width}
                      value={lmWidth}
                      onChange={(e) => setLmWidth(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                      Height (rows)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={section.height}
                      value={lmHeight}
                      onChange={(e) => setLmHeight(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                    Radius
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={Math.min(section.width, section.height)}
                    value={lmRadius}
                    onChange={(e) => setLmRadius(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsLandmarkModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  data-testid="submit-landmark-btn"
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Save Landmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
