import type { OptimizeResult, ParsedMission } from "@/types";
import { MISSION_COLORS } from "@/types";

interface ContractScreenProps {
  missions: ParsedMission[];
  optimizeResult: OptimizeResult;
  onBack: () => void;
  onNext: () => void;
}

export function ContractScreen({ missions, optimizeResult, onBack, onNext }: ContractScreenProps) {
  const selected = optimizeResult.selectedMissionIndices
    .map((idx) => ({ idx, mission: missions[idx] }))
    .filter((m) => m.mission != null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-text-dim">
            Phase 04
          </div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Contracts</h1>
          <p className="mt-2 max-w-[560px] text-sm text-muted-foreground">
            Review all active contracts before you start hauling.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-2 rounded border border-transparent bg-transparent px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={onBack}
          >
            <span className="font-mono">←</span> Back
          </button>
          <button
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            onClick={onNext}
          >
            Begin haul <span className="font-mono opacity-70">→</span>
          </button>
        </div>
      </div>

      <div className="my-6 h-px shrink-0 bg-border" />

      <div className="flex-1 overflow-y-auto pb-8">
        {selected.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-[10px] border border-dashed border-border text-[13px] text-text-dim">
            No contracts selected.
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-[860px]">
            {selected.map(({ idx, mission }) => (
              <ContractCard
                key={idx}
                mission={mission}
                color={MISSION_COLORS[idx % MISSION_COLORS.length]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContractCard({ mission, color }: { mission: ParsedMission; color: string }) {
  const totalScu = mission.deliveries.reduce((s, d) => s + (d.scu ?? 0), 0);

  return (
    <div className="relative overflow-hidden rounded-[10px] border border-border bg-surface px-5 py-4">
      <div className="absolute bottom-0 left-0 top-0 w-[3px]" style={{ background: color }} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="text-[14px] font-medium">{mission.title}</div>
        <div className="flex shrink-0 items-center gap-3 font-mono text-[11px] text-muted-foreground">
          {totalScu > 0 && (
            <span className="rounded bg-surface-2 px-2 py-0.5">{totalScu} SCU</span>
          )}
          {mission.xp != null && (
            <span className="rounded bg-surface-2 px-2 py-0.5">{mission.xp} XP</span>
          )}
          {mission.rewardUec != null && (
            <span className="rounded bg-surface-2 px-2 py-0.5">
              {mission.rewardUec.toLocaleString()} aUEC
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 border-t border-border pt-3 font-mono text-[12px] flex flex-col gap-2">
        {mission.deliveries.map((delivery, di) => (
          <div key={di}>
            <div className="text-foreground">
              Deliver 0/{delivery.scu ?? totalScu} SCU of{" "}
              {delivery.cargoType ?? mission.cargoType ?? "cargo"} to {delivery.location}
            </div>
            {mission.pickups.map((pickup, pi) => (
              <div key={pi} className="mt-0.5 pl-4 text-muted-foreground">
                — collect {pickup.scu != null ? `${pickup.scu} SCU` : "cargo"} from{" "}
                {pickup.location}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
