import { cn } from "@/lib/utils"
import { PHASES, type Phase } from "@/types"

interface AppShellProps {
  phase: Phase
  onPhaseClick: (phase: Phase) => void
  children: React.ReactNode
  unlockedUpTo?: Phase
}

export function AppShell({
  phase,
  onPhaseClick,
  children,
  unlockedUpTo,
}: AppShellProps) {
  const phaseIdx = PHASES.findIndex((p) => p.id === phase)
  const unlockedIdx = unlockedUpTo
    ? PHASES.findIndex((p) => p.id === unlockedUpTo)
    : phaseIdx

  return (
    <div className="flex h-screen overflow-hidden flex-col">
      <header
        className="sticky top-0 z-10 flex items-center gap-8 border-b border-border px-7 py-3.5"
        style={{ background: "var(--bg-2)" }}
      >
        <div className="flex items-center gap-2.5 font-mono text-xs tracking-widest uppercase">
          <div
            className="grid h-[22px] w-[22px] place-items-center rounded-[4px]"
            style={{
              border: "1.5px solid var(--primary)",
              background: "oklch(0.22 0.02 200)",
            }}
          >
            <div
              className="h-2 w-2 rounded-[1px]"
              style={{ background: "var(--primary)" }}
            />
          </div>
          <span>HAULER · v0.1</span>
        </div>

        <nav className="flex flex-1 items-center gap-1">
          {PHASES.map((p, i) => {
            const isActive = p.id === phase
            const isDone = i < phaseIdx
            const isLocked = i > unlockedIdx
            return (
              <div key={p.id} className="flex items-center gap-1">
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-2 rounded px-3 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase transition-colors",
                    isActive && "bg-surface text-foreground",
                    isDone && "text-muted-foreground",
                    !isActive && !isDone && "text-text-dim",
                    isLocked && "cursor-not-allowed opacity-40"
                  )}
                  onClick={() => !isLocked && onPhaseClick(p.id)}
                  disabled={isLocked}
                >
                  <span
                    className={cn(
                      "grid h-[18px] w-[18px] place-items-center rounded-full border text-[10px]",
                      isActive &&
                        "border-primary bg-primary text-primary-foreground",
                      isDone &&
                        "border-muted-foreground bg-muted-foreground text-primary-foreground",
                      !isActive && !isDone && "border-current opacity-80"
                    )}
                  >
                    {isDone ? "✓" : p.num}
                  </span>
                  {p.label}
                </button>
                {i < PHASES.length - 1 && (
                  <div className="h-px w-3.5 bg-border" />
                )}
              </div>
            )
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1480px] flex-1 overflow-hidden px-10 py-8">
        {children}
      </main>
    </div>
  )
}
