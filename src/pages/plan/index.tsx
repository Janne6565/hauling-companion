import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type {
  LocationDto,
  LockState,
  OptimizeGoal,
  OptimizeResult,
  ParsedMission,
  ShipId,
  Stop,
  StopItem,
} from "@/types";
import { MISSION_COLORS, MISSION_COLORS_SOFT, SHIPS } from "@/types";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/lib/use-local-storage";

interface PlanScreenProps {
  missions: ParsedMission[];
  onBack: (missions: ParsedMission[]) => void;
  onNext: (result: OptimizeResult, missions: ParsedMission[]) => void;
}

export function PlanScreen({ missions, onBack, onNext }: PlanScreenProps) {
  const [ship, setShip] = useLocalStorage<ShipId>("sch:plan:ship", SHIPS[0].id);
  const [goal, setGoal] = useLocalStorage<OptimizeGoal>("sch:plan:goal", "PROFIT");
  const [maxMissions, setMaxMissions] = useLocalStorage("sch:plan:maxMissions", Math.min(missions.length, 10));
  const [maxStops, setMaxStops] = useLocalStorage("sch:plan:maxStops", 5);
  const [currentLocation, setCurrentLocation] = useLocalStorage("sch:plan:currentLocation", "");
  const [allowInterstellar, setAllowInterstellar] = useLocalStorage("sch:plan:allowInterstellar", true);
  const [locks, setLocks] = useLocalStorage<LockState[]>("sch:plan:locks", missions.map(() => "default"));
  const [result, setResult] = useLocalStorage<OptimizeResult | null>("sch:plan:result", null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear result whenever any setting changes (skip initial mount)
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    setResult(null);
    setError(null);
  }, [ship, goal, maxMissions, maxStops, currentLocation, allowInterstellar, locks]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset locks when mission count changes (new import session)
  useEffect(() => {
    if (locks.length !== missions.length) {
      setLocks(missions.map(() => "default"));
      setResult(null);
    }
  }, [missions.length]); // eslint-disable-line react-hooks/exhaustive-deps

function cycleLock(i: number) {
    setLocks((prev) =>
      prev.map((l, idx) =>
        idx !== i ? l : l === "default" ? "force_in" : l === "force_in" ? "force_out" : "default",
      ),
    );
  }

  async function handleOptimize() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const forceInclude = locks
        .map((l, i) => (l === "force_in" ? i : -1))
        .filter((i) => i >= 0);
      const forceExclude = locks
        .map((l, i) => (l === "force_out" ? i : -1))
        .filter((i) => i >= 0);

      const res = await fetch("/api/v1/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missions,
          currentLocation,
          ship,
          goal,
          maxMissions,
          maxStops,
          forceInclude,
          forceExclude,
          allowInterstellar,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: OptimizeResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const shipConfig = SHIPS.find((s) => s.id === ship)!;
  const totalScu = missions
    .filter((_, i) => locks[i] !== "force_out")
    .flatMap((m) => m.deliveries)
    .reduce((s, d) => s + (d.scu ?? 0), 0);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-text-dim">
            Phase 03
          </div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Plan your haul</h1>
          <p className="mt-2 max-w-[560px] text-sm text-muted-foreground">
            Set your ship, starting location, and goal — then let the optimizer pick the
            best route.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-2 rounded border border-transparent bg-transparent px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => onBack(missions)}
          >
            <span className="font-mono">←</span> Back
          </button>
          {result ? (
            <button
              className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              onClick={() => onNext(result, missions)}
            >
              Confirm haul <span className="font-mono opacity-70">→</span>
            </button>
          ) : (
            <button
              disabled={loading || missions.length === 0 || !currentLocation}
              onClick={handleOptimize}
              className={cn(
                "inline-flex items-center gap-2 rounded px-4 py-2 text-[13px] font-semibold transition-colors",
                loading || missions.length === 0 || !currentLocation
                  ? "cursor-not-allowed bg-surface text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:opacity-90",
              )}
            >
              {loading ? "Optimizing…" : "Optimize route"}
            </button>
          )}
        </div>
      </div>

      <div className="my-6 h-px shrink-0 bg-border" />

      <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-[380px_1fr]">
        {/* ── Left: settings + mission locks ─────────────────────────────── */}
        <div className="flex flex-col gap-6 overflow-y-auto pb-8 pl-1 pr-2">
          {/* Ship */}
          <Section label="Ship">
            <ShipSelect value={ship} onChange={setShip} />
            <div className="mt-2 font-mono text-[11px] text-muted-foreground">
              {shipConfig.capacity} SCU capacity
            </div>
          </Section>

          {/* Current location */}
          <Section label="Current location">
            <LocationSearch value={currentLocation} onChange={setCurrentLocation} />
          </Section>

          {/* Goal */}
          <Section label="Optimize for">
            <div className="grid grid-cols-2 gap-2">
              {(["PROFIT", "XP"] as OptimizeGoal[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className={cn(
                    "rounded-[8px] border px-3.5 py-2 font-mono text-[12px] uppercase tracking-[0.08em] transition-colors",
                    goal === g
                      ? "border-primary bg-accent text-foreground"
                      : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
                  )}
                >
                  {g === "PROFIT" ? "Profit (aUEC)" : "XP / Rank"}
                </button>
              ))}
            </div>
          </Section>

          {/* Interstellar travel */}
          <Section label="Interstellar travel">
            <div className="grid grid-cols-2 gap-2">
              {([true, false] as const).map((val) => (
                <button
                  key={String(val)}
                  onClick={() => setAllowInterstellar(val)}
                  className={cn(
                    "rounded-[8px] border px-3.5 py-2 font-mono text-[12px] uppercase tracking-[0.08em] transition-colors",
                    allowInterstellar === val
                      ? "border-primary bg-accent text-foreground"
                      : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
                  )}
                >
                  {val ? "Allow" : "Block"}
                </button>
              ))}
            </div>
          </Section>

          {/* Max missions */}
          <Section label={`Max missions · ${maxMissions}`}>
            <input
              type="range"
              min={1}
              max={20}
              value={maxMissions}
              onChange={(e) => setMaxMissions(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-text-dim">
              <span>1</span>
              <span>20</span>
            </div>
          </Section>

          {/* Max stops */}
          <Section label={`Max stops · ${maxStops}`}>
            <input
              type="range"
              min={1}
              max={30}
              value={maxStops}
              onChange={(e) => setMaxStops(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-text-dim">
              <span>1</span>
              <span>30</span>
            </div>
          </Section>

          {/* Capacity indicator */}
          <div className="rounded-[8px] border border-border bg-surface px-3.5 py-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-dim">
                Max cargo (est.)
              </span>
              <span
                className={cn(
                  "font-mono text-[12px] font-medium",
                  totalScu > shipConfig.capacity ? "text-danger" : "text-muted-foreground",
                )}
              >
                {totalScu} / {shipConfig.capacity} SCU
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  totalScu > shipConfig.capacity ? "bg-danger" : "bg-primary",
                )}
                style={{ width: `${Math.min((totalScu / shipConfig.capacity) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Missions */}
          <Section label={`Missions · ${missions.length}`}>
            {missions.length === 0 ? (
              <p className="text-[12px] text-text-dim">No missions. Go back and import some.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {missions.map((m, i) => (
                  <MissionLockRow
                    key={i}
                    mission={m}
                    index={i}
                    lock={locks[i]}
                    onCycle={() => cycleLock(i)}
                  />
                ))}
              </div>
            )}
          </Section>

          {error && (
            <p className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-[12px] text-danger">
              {error}
            </p>
          )}
        </div>

        {/* ── Right: result ───────────────────────────────────────────────── */}
        <div className="overflow-y-auto pb-8">
          {!result && !loading && (
            <div className="flex h-48 items-center justify-center rounded-[10px] border border-dashed border-border text-[13px] text-text-dim">
              Configure settings and click "Optimize route"
            </div>
          )}
          {loading && (
            <div className="flex h-48 items-center justify-center rounded-[10px] border border-border bg-surface text-[13px] text-muted-foreground">
              <span className="animate-pulse">Computing optimal route…</span>
            </div>
          )}
          {result && !loading && (
            <OptimizeResultPanel result={result} missions={missions} currentLocation={currentLocation} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Ship select ────────────────────────────────────────────────────────────

function ShipSelect({ value, onChange }: { value: ShipId; onChange: (id: ShipId) => void }) {
  const manufacturers = Array.from(new Set(SHIPS.map((s) => s.manufacturer)));
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ShipId)}
      className="w-full rounded border border-border bg-input px-3 py-2 font-mono text-[12px] text-foreground outline-none transition-colors focus:border-primary"
    >
      {manufacturers.map((mfr) => (
        <optgroup key={mfr} label={mfr}>
          {SHIPS.filter((s) => s.manufacturer === mfr).map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} — {s.capacity} SCU
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

// ── Location search ────────────────────────────────────────────────────────

function LocationSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationDto[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback((q: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (q.length < 2) { setResults([]); setOpen(false); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/locations/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data: LocationDto[] = await res.json();
          setResults(data);
          setOpen(true);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }, 500);
  }, []);

  function handleInput(v: string) {
    setQuery(v);
    onChange(v);
    search(v);
  }

  function pick(loc: LocationDto) {
    setQuery(loc.name);
    onChange(loc.name);
    setOpen(false);
    setResults([]);
  }

  return (
    <div ref={ref} className="relative">
      <input
        className="w-full rounded border border-border bg-input px-3 py-2 font-mono text-[12px] text-foreground outline-none transition-colors placeholder:text-text-dim focus:border-primary"
        placeholder="Search locations…"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {loading && (
        <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
          <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
        </div>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[8px] border border-border bg-surface-2 shadow-lg">
          {results.slice(0, 10).map((loc) => (
            <button
              key={loc.name}
              className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-surface"
              onMouseDown={() => pick(loc)}
            >
              <span className="text-[13px]">{loc.name}</span>
              {loc.parentBody && (
                <span className="ml-2 shrink-0 font-mono text-[10px] text-text-dim">
                  {loc.parentBody}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Mission lock row ────────────────────────────────────────────────────────

function MissionLockRow({
  mission,
  index,
  lock,
  onCycle,
}: {
  mission: ParsedMission;
  index: number;
  lock: LockState;
  onCycle: () => void;
}) {
  const color = MISSION_COLORS[index % MISSION_COLORS.length];
  const soft = MISSION_COLORS_SOFT[index % MISSION_COLORS_SOFT.length];

  return (
    <div
      className="relative flex items-center gap-2.5 overflow-hidden rounded-[8px] border border-border bg-surface px-3 py-2"
      style={lock === "force_out" ? { opacity: 0.4 } : undefined}
    >
      <div className="absolute bottom-0 left-0 top-0 w-[3px]" style={{ background: color }} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-medium">{mission.title}</div>
        <div className="mt-0.5 font-mono text-[10px] text-text-dim">
          {mission.rewardUec != null ? `${mission.rewardUec.toLocaleString()} aUEC` : "—"}
          {mission.xp != null ? ` · ${mission.xp} XP` : ""}
          {(() => {
            const scu = mission.deliveries.reduce((s, d) => s + (d.scu ?? 0), 0);
            return scu > 0 ? ` · ${scu} SCU` : "";
          })()}
        </div>
      </div>
      <button
        onClick={onCycle}
        title={lock === "default" ? "Click to force-include" : lock === "force_in" ? "Force-included — click to force-exclude" : "Force-excluded — click to reset"}
        className={cn(
          "shrink-0 rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] transition-colors",
          lock === "default" && "text-text-dim hover:text-muted-foreground",
          lock === "force_in" && "text-success",
          lock === "force_out" && "text-danger",
        )}
        style={lock === "force_in" ? { background: soft } : undefined}
      >
        {lock === "default" ? "FREE" : lock === "force_in" ? "↑ IN" : "↓ OUT"}
      </button>
    </div>
  );
}

// ── Optimize result panel ───────────────────────────────────────────────────

function OptimizeResultPanel({
  result,
  missions,
  currentLocation,
}: {
  result: OptimizeResult;
  missions: ParsedMission[];
  currentLocation: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Stops" value={String(result.stopCount)} />
        <StatCard label="Reward" value={`${result.totalRewardUec.toLocaleString()} aUEC`} />
        <StatCard label="XP" value={String(result.totalXp || "—")} />
      </div>

      {/* Selected missions */}
      <div>
        <SectionLabel>Selected missions · {result.selectedMissionIndices.length}</SectionLabel>
        <div className="mt-2 flex flex-col gap-1.5">
          {result.selectedMissionIndices.map((mIdx) => {
            const m = missions[mIdx];
            if (!m) return null;
            const color = MISSION_COLORS[mIdx % MISSION_COLORS.length];
            return (
              <div
                key={mIdx}
                className="relative flex items-center gap-2.5 overflow-hidden rounded-[8px] border border-border bg-surface px-3 py-2"
              >
                <div className="absolute bottom-0 left-0 top-0 w-[3px]" style={{ background: color }} />
                <div className="min-w-0 flex-1 truncate text-[13px]">{m.title}</div>
                <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-muted-foreground">
                  {(() => {
                    const scu = m.deliveries.reduce((s, d) => s + (d.scu ?? 0), 0);
                    return scu > 0 ? <span>{scu} SCU</span> : null;
                  })()}
                  <span>{m.rewardUec?.toLocaleString()} aUEC</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Route timeline */}
      <div>
        <SectionLabel>Route · {result.stops.length} stops</SectionLabel>
        <div className="mt-3">
          <RouteTimeline
            stops={result.stops}
            currentLocation={currentLocation}
            missions={missions}
            missionIndices={result.selectedMissionIndices}
          />
        </div>
      </div>
    </div>
  );
}

// ── Route timeline ──────────────────────────────────────────────────────────

function RouteTimeline({
  stops,
  currentLocation,
  missions,
  missionIndices,
}: {
  stops: Stop[];
  currentLocation: string;
  missions: ParsedMission[];
  missionIndices: number[];
}) {
  return (
    <div className="flex flex-col">
      {/* Start node */}
      <div className="rounded-[8px] border border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-full border-2"
            style={{ borderColor: "var(--primary)" }}
          />
          <div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-text-dim">
              Starting position
            </div>
            <div className="text-[13px] font-medium">{currentLocation || "—"}</div>
          </div>
        </div>
      </div>

      {stops.map((stop, i) => (
        <Fragment key={i}>
          <FlightConnector label={stop.distanceLabel} />
          <StopCard stop={stop} index={i} missions={missions} missionIndices={missionIndices} />
        </Fragment>
      ))}
    </div>
  );
}

function FlightConnector({ label }: { label?: string }) {
  const isSameArea = !label || label === "Same area";
  const text = isSameArea ? "Short flight / drive" : `Fly  ${label}`;
  return (
    <div className="flex items-center gap-3 py-1.5 pl-4">
      <div className="flex flex-col items-center gap-[3px]">
        <div className="h-2.5 w-px bg-border" />
        <div
          className="h-[7px] w-[7px] rotate-45 border"
          style={{ borderColor: "var(--border-strong)" }}
        />
        <div className="h-2.5 w-px bg-border" />
      </div>
      <span
        className={cn(
          "font-mono text-[11px]",
          isSameArea ? "text-text-dim" : "text-muted-foreground",
        )}
      >
        {text}
      </span>
    </div>
  );
}

function StopCard({
  stop,
  index,
  missions,
  missionIndices,
}: {
  stop: Stop;
  index: number;
  missions: ParsedMission[];
  missionIndices: number[];
}) {
  const typeColor =
    stop.stopType === "PICKUP"
      ? "text-primary border-primary/40"
      : stop.stopType === "DROPOFF"
        ? "text-success border-[oklch(0.50_0.10_150)]"
        : "text-accent-foreground border-border-strong";

  return (
    <div className="rounded-[8px] border border-border bg-surface px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full border font-mono text-[10px]"
            style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
          >
            {index + 1}
          </span>
          <span className="text-[14px] font-medium">{stop.location}</span>
          {stop.parentBody && (
            <span className="font-mono text-[10px] text-text-dim">{stop.parentBody}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {stop.distanceLabel && stop.distanceLabel !== "Same area" && (
            <span className="font-mono text-[10px] text-text-dim">{stop.distanceLabel}</span>
          )}
          <span
            className={cn(
              "rounded-[3px] border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.06em]",
              typeColor,
            )}
          >
            {stop.stopType.replace("_", "+")}
          </span>
        </div>
      </div>

      {(stop.pickups.length > 0 || stop.dropoffs.length > 0) && (
        <div className="mt-2.5 flex flex-col gap-1.5 border-t border-border pt-2.5">
          {stop.pickups.length > 0 && (
            <ItemList label="PICK UP" items={stop.pickups} missions={missions} bullet="pickup" />
          )}
          {stop.dropoffs.length > 0 && (
            <ItemList label="DELIVER" items={stop.dropoffs} missions={missions} bullet="dropoff" missionIndices={missionIndices} />
          )}
        </div>
      )}
    </div>
  );
}

function ItemList({
  label,
  items,
  missions,
  bullet,
  missionIndices,
}: {
  label: string;
  items: StopItem[];
  missions: ParsedMission[];
  bullet: "pickup" | "dropoff";
  missionIndices?: number[];
}) {
  return (
    <div>
      <div className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-text-dim">
        {label}
      </div>
      {items.map((item, i) => {
        const mIdx = item.missionIndex;
        const color = MISSION_COLORS[mIdx % MISSION_COLORS.length];
        return (
          <div key={i} className="flex items-center gap-2 py-0.5">
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: color }}
            />
            <span className="text-[12px]">{item.cargoType ?? missions[mIdx]?.cargoType ?? "cargo"}</span>
            {item.scu != null && (
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                {item.scu} SCU
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Small shared components ────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-text-dim">
        {label}
      </div>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-dim">
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[8px] border border-border bg-surface px-3.5 py-2.5">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-text-dim">{label}</span>
      <span className="font-mono text-[16px] font-medium">{value}</span>
    </div>
  );
}
