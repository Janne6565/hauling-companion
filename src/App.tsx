import { AppShell } from "@/components/app-shell"
import { useLocalStorage } from "@/lib/use-local-storage"
import { ContractScreen } from "@/pages/contract"
import { HaulScreen } from "@/pages/haul"
import { ImportScreen } from "@/pages/import"
import { PlanScreen } from "@/pages/plan"
import { ReviewScreen } from "@/pages/review"
import type { OptimizeResult, ParsedMission, Phase } from "@/types"

export default function App() {
  const [phase, setPhase] = useLocalStorage<Phase>("sch:phase", "import")
  const [missions, setMissions] = useLocalStorage<ParsedMission[]>(
    "sch:missions",
    []
  )
  const [optimizeResult, setOptimizeResult] =
    useLocalStorage<OptimizeResult | null>("sch:optimizeResult", null)

  function handleImportNext(parsed: ParsedMission[]) {
    setMissions(parsed)
    setPhase("review")
  }

  function handleReviewBack(reviewed: ParsedMission[]) {
    setMissions(reviewed)
    setPhase("import")
  }

  function handleReviewNext(reviewed: ParsedMission[]) {
    setMissions(reviewed)
    setPhase("plan")
  }

  function handlePlanBack(updated: ParsedMission[]) {
    setMissions(updated)
    setPhase("review")
  }

  function handlePlanNext(result: OptimizeResult, updated: ParsedMission[]) {
    setOptimizeResult(result)
    setMissions(updated)
    setPhase("contract")
  }

  function handleContractBack() {
    setPhase("plan")
  }

  function handleContractNext() {
    localStorage.removeItem("sch:haul:stopIdx")
    localStorage.removeItem("sch:haul:completed")
    localStorage.removeItem("sch:haul:delivered")
    setPhase("haul")
  }

  function handleHaulAbandon() {
    localStorage.removeItem("sch:haul:stopIdx")
    localStorage.removeItem("sch:haul:completed")
    localStorage.removeItem("sch:haul:delivered")
    setOptimizeResult(null)
    setPhase("import")
  }

  function handleHaulFinish() {
    setPhase("done")
  }

  return (
    <AppShell phase={phase} onPhaseClick={setPhase} unlockedUpTo={phase}>
      {phase === "import" && (
        <ImportScreen onNext={handleImportNext} initialMissions={missions} />
      )}
      {phase === "review" && (
        <ReviewScreen
          missions={missions}
          onBack={handleReviewBack}
          onNext={handleReviewNext}
        />
      )}
      {phase === "plan" && (
        <PlanScreen
          missions={missions}
          onBack={handlePlanBack}
          onNext={handlePlanNext}
        />
      )}
      {phase === "contract" && optimizeResult && (
        <ContractScreen
          missions={missions}
          optimizeResult={optimizeResult}
          onBack={handleContractBack}
          onNext={handleContractNext}
        />
      )}
      {phase === "contract" && !optimizeResult && (
        <div className="py-24 text-center text-sm text-text-dim">
          No active plan. Go back to plan a route.
          <button
            type="button"
            className="mt-4 block mx-auto rounded border border-border px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground"
            onClick={() => setPhase("plan")}
          >
            ← Back to plan
          </button>
        </div>
      )}
      {phase === "haul" && optimizeResult && (
        <HaulScreen
          missions={missions}
          optimizeResult={optimizeResult}
          onAbandon={handleHaulAbandon}
          onFinish={handleHaulFinish}
        />
      )}
      {phase === "haul" && !optimizeResult && (
        <div className="py-24 text-center text-sm text-text-dim">
          No active haul. Go back to plan a route.
          <button
            type="button"
            className="mt-4 block mx-auto rounded border border-border px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground"
            onClick={() => setPhase("plan")}
          >
            ← Back to plan
          </button>
        </div>
      )}
      {phase === "done" && (
        <DoneScreen
          optimizeResult={optimizeResult}
          onNewHaul={() => {
            setOptimizeResult(null)
            setPhase("import")
          }}
        />
      )}
    </AppShell>
  )
}

// ── Done screen ────────────────────────────────────────────────────────────────

function DoneScreen({
  optimizeResult,
  onNewHaul,
}: {
  optimizeResult: OptimizeResult | null
  onNewHaul: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-20">
      <div className="text-center">
        <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-text-dim">
          Phase 06
        </div>
        <h1 className="mt-2 text-3xl font-medium tracking-tight">
          Haul complete
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          All stops completed successfully.
        </p>
      </div>

      {optimizeResult && (
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          <StatCard label="Stops" value={String(optimizeResult.stopCount)} />
          <StatCard
            label="Earned"
            value={`${optimizeResult.totalRewardUec.toLocaleString()} aUEC`}
          />
          <StatCard
            label="XP"
            value={
              optimizeResult.totalXp ? String(optimizeResult.totalXp) : "—"
            }
          />
        </div>
      )}

      <button
        type="button"
        onClick={onNewHaul}
        className="rounded bg-primary px-6 py-2.5 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-primary-foreground transition-opacity hover:opacity-90"
      >
        Start new haul
      </button>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[8px] border border-border bg-surface px-3.5 py-2.5">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-text-dim">
        {label}
      </span>
      <span className="font-mono text-[14px] font-medium">{value}</span>
    </div>
  )
}
