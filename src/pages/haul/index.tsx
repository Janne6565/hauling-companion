import { useMemo, useRef, useEffect, useState } from "react";
import type { JSX } from "react";
import type { OptimizeResult, ParsedMission, ShipId } from "@/types";
import { MISSION_COLORS, MISSION_COLORS_SOFT, SHIPS } from "@/types";
import { getShipLayout, type ShipLayout } from "@/data/cargo-grids";
import {
  buildCargoAssignment,
  computeDeliveryGroups,
  getPickupDestinations,
} from "@/lib/cargo-assignment";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/lib/use-local-storage";
import type { Stop, StopItem } from "@/types";

// ── Color helpers ────────────────────────────────────────────────────────────

/**
 * Build a map from delivery-stop-index → color variables.
 * Only stops that have dropoffs get a color; they're numbered 0,1,2… in
 * route order and cycle through the 7 mission palette entries.
 */
function buildDeliveryColorMap(
  stops: Stop[],
): Map<number, { color: string; soft: string }> {
  const map = new Map<number, { color: string; soft: string }>();
  let ci = 0;
  for (let i = 0; i < stops.length; i++) {
    if (stops[i].dropoffs.length > 0) {
      map.set(i, {
        color: MISSION_COLORS[ci % MISSION_COLORS.length],
        soft: MISSION_COLORS_SOFT[ci % MISSION_COLORS_SOFT.length],
      });
      ci++;
    }
  }
  return map;
}

/** Whether a delivery zone currently has cargo sitting on the ship. */
function isZoneOccupied(
  deliveryStopIdx: number,
  stops: Stop[],
  completedStops: number[],
): boolean {
  if (completedStops.includes(deliveryStopIdx)) return false;
  return (stops[deliveryStopIdx]?.dropoffs ?? []).some((item) =>
    stops.some(
      (s, j) =>
        completedStops.includes(j) &&
        s.pickups.some((p) => p.missionIndex === item.missionIndex),
    ),
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface HaulScreenProps {
  missions: ParsedMission[];
  optimizeResult: OptimizeResult;
  onAbandon: () => void;
  onFinish: () => void;
}

export function HaulScreen({
  missions,
  optimizeResult,
  onAbandon,
  onFinish,
}: HaulScreenProps) {
  const [shipId] = useLocalStorage<ShipId>("sch:plan:ship", "C2_HERCULES");
  const [currentStopIdx, setCurrentStopIdx] = useLocalStorage(
    "sch:haul:stopIdx",
    0,
  );
  const [completedStops, setCompletedStops] = useLocalStorage<number[]>(
    "sch:haul:completed",
    [],
  );
  const [deliveredKeys, setDeliveredKeys] = useLocalStorage<string[]>(
    "sch:haul:delivered",
    [],
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  const stops = optimizeResult.stops;
  const currentStop = stops[currentStopIdx];
  const isLastStop = currentStopIdx === stops.length - 1;

  // Ship layout
  const shipConfig = SHIPS.find((s) => s.id === shipId);
  const layout = shipConfig ? getShipLayout(shipConfig.label) : null;

  // Delivery colors (keyed by stop index)
  const deliveryColorMap = useMemo(
    () => buildDeliveryColorMap(stops),
    [stops],
  );

  // Delivery groups for cargo assignment
  const deliveryGroups = useMemo(
    () => computeDeliveryGroups(stops),
    [stops],
  );

  // Cargo grid assignment: "wx,wz" → delivery stop index
  const cargoAssignment = useMemo<Map<string, number>>(() => {
    if (!layout) return new Map();
    return buildCargoAssignment(layout, deliveryGroups);
  }, [layout, deliveryGroups]);

  // Which delivery zones are being loaded at the current pickup stop
  const loadingZones = useMemo<Set<number>>(() => {
    if (!currentStop || currentStop.pickups.length === 0) return new Set();
    const zones = new Set<number>();
    for (const item of currentStop.pickups) {
      for (const dest of getPickupDestinations(
        item.missionIndex,
        item.scu ?? 0,
        stops,
      )) {
        zones.add(dest.stopIdx);
      }
    }
    return zones;
  }, [currentStop, stops]);

  // Zone being unloaded at current dropoff stop
  const unloadingZone =
    currentStop && currentStop.dropoffs.length > 0 ? currentStopIdx : null;

  function markComplete() {
    if (!completedStops.includes(currentStopIdx)) {
      setCompletedStops([...completedStops, currentStopIdx]);
    }
    if (isLastStop) {
      onFinish();
    } else {
      setCurrentStopIdx(currentStopIdx + 1);
    }
  }

  function toggleDelivered(key: string) {
    setDeliveredKeys(
      deliveredKeys.includes(key)
        ? deliveredKeys.filter((k) => k !== key)
        : [...deliveredKeys, key],
    );
  }

  if (!currentStop) {
    return (
      <div className="py-24 text-center text-sm text-text-dim">
        No stops in this haul.
      </div>
    );
  }

  const progressPct =
    stops.length > 0 ? (completedStops.length / stops.length) * 100 : 0;
  const allDeliveredAtCurrentStop =
    currentStop.dropoffs.length > 0 &&
    currentStop.dropoffs.every((_, i) =>
      deliveredKeys.includes(`${currentStopIdx}-d-${i}`),
    );

  return (
    <div>
      {isFullscreen && (
        <FullscreenOverlay
          stop={currentStop}
          stopIdx={currentStopIdx}
          stops={stops}
          missions={missions}
          deliveryColorMap={deliveryColorMap}
          deliveredKeys={deliveredKeys}
          onToggleDelivered={toggleDelivered}
          layout={layout}
          shipLabel={shipConfig?.label ?? ""}
          assignment={cargoAssignment}
          loadingZones={loadingZones}
          unloadingZone={unloadingZone}
          totalStops={stops.length}
          isLastStop={isLastStop}
          onClose={() => setIsFullscreen(false)}
          onNext={markComplete}
          onBack={() => setCurrentStopIdx(Math.max(0, currentStopIdx - 1))}
          canGoBack={currentStopIdx > 0}
        />
      )}
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-text-dim">
            Phase 05
          </div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">
            Hauling
          </h1>
          <p className="mt-2 max-w-[520px] text-sm text-muted-foreground">
            Follow each stop in order. Cargo zones on the grid correspond to
            delivery locations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(true)}
            className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          >
            ⛶ Full screen
          </button>
          <button
            onClick={onAbandon}
            className="inline-flex items-center gap-2 rounded border border-danger/30 px-4 py-2 text-[13px] font-medium text-danger transition-colors hover:bg-danger/10"
          >
            Abandon haul
          </button>
        </div>
      </div>

      {/* ── Progress ── */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-dim">
            Haul progress
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {completedStops.length} / {stops.length} stops complete
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="my-5 h-px bg-border" />

      {/* ── Two-column layout ── */}
      <div className="grid gap-8 xl:grid-cols-[500px_1fr]">
        {/* Left: stop card + navigation */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-dim">
              Stop {currentStopIdx + 1} of {stops.length}
            </span>
          </div>

          {/* Stop card */}
          <StopCard
            stop={currentStop}
            stopIdx={currentStopIdx}
            missions={missions}
            stops={stops}
            deliveryColorMap={deliveryColorMap}
            deliveredKeys={deliveredKeys}
            onToggleDelivered={toggleDelivered}
          />

          {/* Navigation + mark complete */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentStopIdx(Math.max(0, currentStopIdx - 1))}
              disabled={currentStopIdx === 0}
              className={cn(
                "rounded px-4 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors",
                currentStopIdx === 0
                  ? "cursor-not-allowed border border-border text-text-dim opacity-40"
                  : "border border-border-strong text-muted-foreground hover:border-primary hover:text-primary",
              )}
            >
              ← Back
            </button>
            <button
              onClick={markComplete}
              className={cn(
                "flex-1 rounded px-4 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors",
                isLastStop
                  ? "bg-success text-primary-foreground hover:opacity-90"
                  : "bg-primary text-primary-foreground hover:opacity-90",
              )}
            >
              {isLastStop
                ? "✓  Complete haul"
                : allDeliveredAtCurrentStop
                  ? "All delivered — mark complete →"
                  : "Mark stop complete  →"}
            </button>
          </div>
        </div>

        {/* Right: cargo hold */}
        <div className="flex flex-col gap-5">
          {layout ? (
            <>
              <CargoHoldPanel
                layout={layout}
                shipLabel={shipConfig?.label ?? ""}
                assignment={cargoAssignment}
                stops={stops}
                completedStops={completedStops}
                deliveryColorMap={deliveryColorMap}
                loadingZones={loadingZones}
                unloadingZone={unloadingZone}
              />
              <DeliveryLegend
                stops={stops}
                deliveryColorMap={deliveryColorMap}
                completedStops={completedStops}
                loadingZones={loadingZones}
                unloadingZone={unloadingZone}
              />
            </>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-[10px] border border-dashed border-border text-[13px] text-text-dim">
              {shipConfig
                ? `Cargo grid not available for ${shipConfig.label}`
                : "Select a ship to see the cargo grid"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stop card ─────────────────────────────────────────────────────────────────

function StopCard({
  stop,
  stopIdx,
  missions,
  stops,
  deliveryColorMap,
  deliveredKeys,
  onToggleDelivered,
}: {
  stop: Stop;
  stopIdx: number;
  missions: ParsedMission[];
  stops: Stop[];
  deliveryColorMap: Map<number, { color: string; soft: string }>;
  deliveredKeys: string[];
  onToggleDelivered: (key: string) => void;
}) {
  const typeColor =
    stop.stopType === "PICKUP"
      ? "text-primary border-primary/40"
      : stop.stopType === "DROPOFF"
        ? "text-success border-[oklch(0.50_0.10_150)]"
        : "text-accent-foreground border-border-strong";

  return (
    <div className="rounded-[10px] border border-border bg-surface p-5">
      {/* Location header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-[18px] font-medium leading-tight">
            {stop.location}
          </div>
          {stop.parentBody && (
            <div className="mt-0.5 font-mono text-[11px] text-text-dim">
              {stop.parentBody}
            </div>
          )}
          {stop.distanceLabel && stop.distanceLabel !== "Same area" ? (
            <div className="mt-1 font-mono text-[11px] text-muted-foreground">
              ↑ {stop.distanceLabel} from previous stop
            </div>
          ) : (
            <div className="mt-1 font-mono text-[11px] text-text-dim">
              Short flight / same area
            </div>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em]",
            typeColor,
          )}
        >
          {stop.stopType.replace("_", "+")}
        </span>
      </div>

      <div className="h-px bg-border mb-4" />

      {/* Pickups */}
      {stop.pickups.length > 0 && (
        <PickupSection
          items={stop.pickups}
          missions={missions}
          stops={stops}
          deliveryColorMap={deliveryColorMap}
        />
      )}

      {/* Dropoffs */}
      {stop.dropoffs.length > 0 && (
        <DropoffSection
          items={stop.dropoffs}
          stopIdx={stopIdx}
          missions={missions}
          deliveryColorMap={deliveryColorMap}
          deliveredKeys={deliveredKeys}
          onToggle={onToggleDelivered}
        />
      )}
    </div>
  );
}

// ── Pickup section ─────────────────────────────────────────────────────────────

function PickupSection({
  items,
  missions,
  stops,
  deliveryColorMap,
}: {
  items: StopItem[];
  missions: ParsedMission[];
  stops: Stop[];
  deliveryColorMap: Map<number, { color: string; soft: string }>;
}) {
  return (
    <div className="mb-3">
      <div className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.1em] text-primary">
        Collect cargo
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const label =
            item.cargoType ??
            missions[item.missionIndex]?.cargoType ??
            "cargo";
          const destinations = getPickupDestinations(
            item.missionIndex,
            item.scu ?? 0,
            stops,
          );

          return (
            <div
              key={i}
              className="rounded-[6px] border border-border bg-surface-2 px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium">{label}</span>
                {item.scu != null && (
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {item.scu} SCU
                  </span>
                )}
              </div>
              {destinations.length > 0 && (
                <div className="mt-1.5 flex flex-col gap-1">
                  {destinations.map((dest, di) => {
                    const dc = deliveryColorMap.get(dest.stopIdx);
                    return (
                      <div
                        key={di}
                        className="flex items-center gap-2 font-mono text-[11px] text-text-dim"
                      >
                        <div
                          className="h-2 w-2 shrink-0 rounded-sm"
                          style={{ background: dc?.color ?? "var(--border)" }}
                        />
                        <span>
                          Place{" "}
                          {destinations.length > 1
                            ? `${dest.scu} SCU`
                            : "all"}{" "}
                          in{" "}
                          <span
                            style={{ color: dc?.color ?? "inherit" }}
                          >
                            {dest.location}
                          </span>{" "}
                          zone
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Dropoff section ─────────────────────────────────────────────────────────────

function DropoffSection({
  items,
  stopIdx,
  missions,
  deliveryColorMap,
  deliveredKeys,
  onToggle,
}: {
  items: StopItem[];
  stopIdx: number;
  missions: ParsedMission[];
  deliveryColorMap: Map<number, { color: string; soft: string }>;
  deliveredKeys: string[];
  onToggle: (key: string) => void;
}) {
  const dc = deliveryColorMap.get(stopIdx);
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-success">
          Deliver cargo
        </span>
        {dc && (
          <div
            className="h-2 w-2 rounded-sm"
            style={{ background: dc.color }}
          />
        )}
      </div>
      <div className="flex flex-col gap-1">
        {items.map((item, i) => {
          const key = `${stopIdx}-d-${i}`;
          const done = deliveredKeys.includes(key);
          const label =
            item.cargoType ??
            missions[item.missionIndex]?.cargoType ??
            "cargo";

          return (
            <button
              key={i}
              onClick={() => onToggle(key)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[6px] px-3 py-2 text-left transition-all",
                "border",
                done
                  ? "border-success/30 bg-success/5 opacity-50"
                  : "border-border hover:border-border-strong hover:bg-surface-2",
              )}
            >
              <div
                className={cn(
                  "grid h-4 w-4 shrink-0 place-items-center rounded border-2 transition-colors",
                  done
                    ? "border-success bg-success/20"
                    : "border-border-strong",
                )}
              >
                {done && (
                  <span className="font-mono text-[10px] text-success">
                    ✓
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "flex-1 text-[13px]",
                  done && "line-through",
                )}
              >
                {label}
              </span>
              {item.scu != null && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  {item.scu} SCU
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Cargo hold panel ───────────────────────────────────────────────────────────

function CargoHoldPanel({
  layout,
  shipLabel,
  assignment,
  stops,
  completedStops,
  deliveryColorMap,
  loadingZones,
  unloadingZone,
}: {
  layout: ShipLayout;
  shipLabel: string;
  assignment: Map<string, number>;
  stops: Stop[];
  completedStops: number[];
  deliveryColorMap: Map<number, { color: string; soft: string }>;
  loadingZones: Set<number>;
  unloadingZone: number | null;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-dim">
          Cargo hold · {shipLabel}
        </span>
        <span className="font-mono text-[10px] text-text-dim">
          {layout.capacity} SCU
        </span>
      </div>
      <CargoGridSVG
        layout={layout}
        assignment={assignment}
        stops={stops}
        completedStops={completedStops}
        deliveryColorMap={deliveryColorMap}
        loadingZones={loadingZones}
        unloadingZone={unloadingZone}
      />
    </div>
  );
}

// ── SVG cargo grid ─────────────────────────────────────────────────────────────

const CELL = 9;
const GAP = 1;
const STEP = CELL + GAP;

function CargoGridSVG({
  layout,
  assignment,
  stops,
  completedStops,
  deliveryColorMap,
  loadingZones,
  unloadingZone,
}: {
  layout: ShipLayout;
  assignment: Map<string, number>;
  stops: Stop[];
  completedStops: number[];
  deliveryColorMap: Map<number, { color: string; soft: string }>;
  loadingZones: Set<number>;
  unloadingZone: number | null;
}) {
  // In "landscape" orientation: z → horizontal axis, x → vertical axis
  // In "portrait" (x-dominant): x → horizontal axis, z → vertical axis
  const zIsH = layout.landscape;

  const svgW = zIsH ? layout.spanZ * STEP : layout.spanX * STEP;
  const svgH = zIsH ? layout.spanX * STEP : layout.spanZ * STEP;

  // Determine fill for a cell
  function cellFill(stopIdx: number): string {
    if (stopIdx === -1) return "var(--surface-2)";
    const dc = deliveryColorMap.get(stopIdx);
    if (!dc) return "var(--surface-2)";

    if (stopIdx === unloadingZone) return dc.color;
    if (loadingZones.has(stopIdx)) return dc.color;
    if (isZoneOccupied(stopIdx, stops, completedStops)) return dc.color;
    // Assigned but cargo not yet on ship (will be loaded later or already delivered)
    return dc.soft;
  }

  function cellOpacity(stopIdx: number): number {
    if (stopIdx === -1) return 1;
    if (stopIdx === unloadingZone) return 1;
    if (loadingZones.has(stopIdx)) return 1;
    if (isZoneOccupied(stopIdx, stops, completedStops)) return 0.8;
    return 0.4;
  }

  function cellClass(stopIdx: number): string {
    if (loadingZones.has(stopIdx)) return "cargo-cell-loading";
    return "";
  }

  const cells: JSX.Element[] = [];

  for (const section of layout.sections) {
    for (let z = 0; z < section.length; z++) {
      for (let x = 0; x < section.width; x++) {
        const wx = section.wx + x;
        const wz = section.wz + z;
        const svgX = zIsH ? wz * STEP : wx * STEP;
        const svgY = zIsH ? wx * STEP : wz * STEP;
        const stopIdx = assignment.get(`${wx},${wz}`) ?? -1;

        cells.push(
          <rect
            key={`${wx},${wz}`}
            x={svgX}
            y={svgY}
            width={CELL}
            height={CELL}
            fill={cellFill(stopIdx)}
            opacity={cellOpacity(stopIdx)}
            className={cellClass(stopIdx)}
            rx={1}
          />,
        );

        // Unloading outline
        if (stopIdx === unloadingZone) {
          cells.push(
            <rect
              key={`outline-${wx},${wz}`}
              x={svgX + 1}
              y={svgY + 1}
              width={CELL - 2}
              height={CELL - 2}
              fill="none"
              stroke="white"
              strokeWidth={1.5}
              strokeOpacity={0.6}
              rx={0.5}
              style={{ pointerEvents: "none" }}
            />,
          );
        }
      }
    }
  }

  // Scale to fit container while preserving proportions
  const maxW = Math.min(svgW * 2, 660);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ width: maxW, maxWidth: "100%", display: "block" }}
        aria-label="Cargo hold top-down view"
      >
        {cells}
      </svg>
    </div>
  );
}

// ── Fullscreen overlay ─────────────────────────────────────────────────────────

function FullscreenOverlay({
  stop,
  stopIdx,
  stops,
  missions,
  deliveryColorMap,
  deliveredKeys,
  onToggleDelivered,
  layout,
  shipLabel,
  assignment,
  loadingZones,
  unloadingZone,
  totalStops,
  isLastStop,
  onClose,
  onNext,
  onBack,
  canGoBack,
}: {
  stop: Stop;
  stopIdx: number;
  stops: Stop[];
  missions: ParsedMission[];
  deliveryColorMap: Map<number, { color: string; soft: string }>;
  deliveredKeys: string[];
  onToggleDelivered: (key: string) => void;
  layout: ShipLayout | null;
  shipLabel: string;
  assignment: Map<string, number>;
  loadingZones: Set<number>;
  unloadingZone: number | null;
  totalStops: number;
  isLastStop: boolean;
  onClose: () => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) onClose();
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowRight") {
        e.preventDefault();
        onNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (canGoBack) onBack();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onNext, onBack, canGoBack]);

  const isPickup = stop.stopType === "PICKUP";
  const isDropoff = stop.stopType === "DROPOFF";

  const vignetteColor = isPickup
    ? "rgba(74, 222, 128, 0.18)"
    : isDropoff
      ? "rgba(96, 165, 250, 0.2)"
      : "rgba(148, 163, 184, 0.1)";

  const typeColor = isPickup
    ? "text-primary border-primary/40 bg-primary/5"
    : isDropoff
      ? "text-success border-success/40 bg-success/5"
      : "text-accent-foreground border-border-strong bg-surface-2";

  const typeLabel = stop.stopType.replace("_AND_", " + ");

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background"
      style={{ boxShadow: `inset 0 0 300px 100px ${vignetteColor}` }}
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">
            Phase 05
          </span>
          <span className="text-text-dim">·</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            Stop {stopIdx + 1} / {totalStops}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden font-mono text-[10px] text-text-dim sm:inline">
            ← → · Space to navigate
          </span>
          <button
            onClick={onClose}
            className="rounded border border-border px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          >
            Exit fullscreen
          </button>
        </div>
      </div>

      {/* Location header */}
      <div className="shrink-0 px-8 pb-4">
        <div className="mb-2">
          <span
            className={cn(
              "rounded border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] font-semibold",
              typeColor,
            )}
          >
            {typeLabel}
          </span>
        </div>
        <div className="text-[32px] font-semibold leading-tight tracking-tight">
          {stop.location}
        </div>
        <div className="mt-1 font-mono text-[12px] text-text-dim">
          {stop.parentBody && <span>{stop.parentBody}</span>}
          {stop.distanceLabel && stop.distanceLabel !== "Same area" && (
            <span className="ml-3 text-muted-foreground">↑ {stop.distanceLabel}</span>
          )}
          {(!stop.distanceLabel || stop.distanceLabel === "Same area") && (
            <span className="ml-1 text-text-dim">Short flight / same area</span>
          )}
        </div>
      </div>

      <div className="mx-8 h-px shrink-0 bg-border" />

      {/* Main content */}
      <div className="flex min-h-0 flex-1 gap-8 px-8 py-5">
        {/* Left: cargo items */}
        <div className="flex w-[340px] shrink-0 flex-col gap-4 overflow-y-auto">
          {stop.pickups.length > 0 && (
            <PickupSection
              items={stop.pickups}
              missions={missions}
              stops={stops}
              deliveryColorMap={deliveryColorMap}
            />
          )}
          {stop.dropoffs.length > 0 && (
            <DropoffSection
              items={stop.dropoffs}
              stopIdx={stopIdx}
              missions={missions}
              deliveryColorMap={deliveryColorMap}
              deliveredKeys={deliveredKeys}
              onToggle={onToggleDelivered}
            />
          )}
        </div>

        {/* Right: cargo grid */}
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3">
          {layout ? (
            <>
              <div className="w-full max-w-[900px]">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-text-dim">
                  Cargo hold · {shipLabel}
                </div>
                <FullscreenCargoGrid
                  layout={layout}
                  assignment={assignment}
                  deliveryColorMap={deliveryColorMap}
                  loadingZones={loadingZones}
                  unloadingZone={unloadingZone}
                />
              </div>
            </>
          ) : (
            <div className="text-sm text-text-dim">
              {shipLabel ? `No cargo grid for ${shipLabel}` : "No ship selected"}
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="flex shrink-0 items-center justify-between border-t border-border px-8 pb-6 pt-3">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className={cn(
            "rounded border px-6 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors",
            !canGoBack
              ? "cursor-not-allowed border-border text-text-dim opacity-30"
              : "border-border-strong text-muted-foreground hover:border-primary hover:text-primary",
          )}
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className={cn(
            "rounded px-8 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors",
            isLastStop
              ? "bg-success text-primary-foreground hover:opacity-90"
              : "bg-primary text-primary-foreground hover:opacity-90",
          )}
        >
          {isLastStop ? "✓  Complete haul" : "Next  →"}
        </button>
      </div>
    </div>
  );
}

// ── Fullscreen cargo grid ──────────────────────────────────────────────────────

function FullscreenCargoGrid({
  layout,
  assignment,
  deliveryColorMap,
  loadingZones,
  unloadingZone,
}: {
  layout: ShipLayout;
  assignment: Map<string, number>;
  deliveryColorMap: Map<number, { color: string; soft: string }>;
  loadingZones: Set<number>;
  unloadingZone: number | null;
}) {
  const FC = 16;
  const FG = 2;
  const FS = FC + FG;

  const zIsH = layout.landscape;
  const svgW = zIsH ? layout.spanZ * FS : layout.spanX * FS;
  const svgH = zIsH ? layout.spanX * FS : layout.spanZ * FS;

  function isActive(stopIdx: number): boolean {
    return loadingZones.has(stopIdx) || stopIdx === unloadingZone;
  }

  const cells: JSX.Element[] = [];

  for (const section of layout.sections) {
    for (let z = 0; z < section.length; z++) {
      for (let x = 0; x < section.width; x++) {
        const wx = section.wx + x;
        const wz = section.wz + z;
        const svgX = zIsH ? wz * FS : wx * FS;
        const svgY = zIsH ? wx * FS : wz * FS;
        const stopIdx = assignment.get(`${wx},${wz}`) ?? -1;
        const active = isActive(stopIdx);
        const dc = stopIdx >= 0 ? deliveryColorMap.get(stopIdx) : null;

        cells.push(
          <rect
            key={`${wx},${wz}`}
            x={svgX}
            y={svgY}
            width={FC}
            height={FC}
            fill={active && dc ? dc.color : stopIdx >= 0 ? "var(--border)" : "var(--surface-2)"}
            opacity={active ? 1 : stopIdx >= 0 ? 0.35 : 0.25}
            rx={2}
          />,
        );

        if (active) {
          cells.push(
            <rect
              key={`outline-${wx},${wz}`}
              x={svgX + 1.5}
              y={svgY + 1.5}
              width={FC - 3}
              height={FC - 3}
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth={1.5}
              rx={1}
              style={{ pointerEvents: "none" }}
            />,
          );
        }
      }
    }
  }

  const maxW = Math.min(svgW * 2.5, 900);

  return (
    <div className="overflow-auto rounded-[10px] border border-border bg-surface p-4">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ width: maxW, maxWidth: "100%", display: "block" }}
        aria-label="Cargo hold top-down view"
      >
        {cells}
      </svg>
    </div>
  );
}

// ── Delivery legend ────────────────────────────────────────────────────────────

function DeliveryLegend({
  stops,
  deliveryColorMap,
  completedStops,
  loadingZones,
  unloadingZone,
}: {
  stops: Stop[];
  deliveryColorMap: Map<number, { color: string; soft: string }>;
  completedStops: number[];
  loadingZones: Set<number>;
  unloadingZone: number | null;
}) {
  const entries = stops
    .map((s, i) => ({ s, i }))
    .filter(({ i }) => deliveryColorMap.has(i));

  if (entries.length === 0) return null;

  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-text-dim">
        Cargo zones
      </div>
      <div className="flex flex-col gap-1.5">
        {entries.map(({ s, i }) => {
          const dc = deliveryColorMap.get(i)!;
          const isLoading = loadingZones.has(i);
          const isUnloading = unloadingZone === i;
          const isDelivered = completedStops.includes(i);
          const isOccupied = !isDelivered && isZoneOccupied(i, stops, completedStops);

          let statusLabel = "waiting to load";
          if (isDelivered) statusLabel = "delivered";
          else if (isUnloading) statusLabel = "unloading now";
          else if (isLoading) statusLabel = "loading now";
          else if (isOccupied) statusLabel = "on ship";

          const totalScu = s.dropoffs.reduce((sum, d) => sum + (d.scu ?? 0), 0);

          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2.5 rounded-[6px] border px-3 py-2",
                isUnloading
                  ? "border-border-strong bg-surface-2"
                  : isLoading
                    ? "border-border bg-surface-2"
                    : "border-border bg-surface",
                isDelivered && "opacity-40",
              )}
            >
              <div
                className={cn(
                  "h-3 w-3 shrink-0 rounded-[2px]",
                  (isLoading || isUnloading) && "cargo-cell-loading",
                )}
                style={{ background: dc.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium">
                  {s.location}
                  {s.parentBody ? (
                    <span className="ml-1 font-normal text-text-dim">
                      · {s.parentBody}
                    </span>
                  ) : null}
                </div>
                <div className="font-mono text-[10px] text-text-dim">
                  {totalScu} SCU
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 font-mono text-[9.5px] uppercase tracking-[0.06em]",
                  isUnloading && "text-success",
                  isLoading && "text-primary",
                  isOccupied && !isLoading && !isUnloading && "text-muted-foreground",
                  !isDelivered && !isOccupied && !isLoading && !isUnloading && "text-text-dim",
                  isDelivered && "text-text-dim",
                )}
              >
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

