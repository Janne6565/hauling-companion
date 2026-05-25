import { useState } from "react"
import type { ParsedMission } from "@/types"
import { MissionCard } from "./mission-card"

interface ReviewScreenProps {
  missions: ParsedMission[]
  onBack: (missions: ParsedMission[]) => void
  onNext: (missions: ParsedMission[]) => void
}

export function ReviewScreen({
  missions: initial,
  onBack,
  onNext,
}: ReviewScreenProps) {
  const [missions, setMissions] = useState<ParsedMission[]>(initial)
  const [newMissionIndex, setNewMissionIndex] = useState<number | null>(null)

  function updateMission(index: number, updated: ParsedMission) {
    setMissions((prev) => prev.map((m, i) => (i === index ? updated : m)))
  }

  function removeMission(index: number) {
    setMissions((prev) => prev.filter((_, i) => i !== index))
  }

  function addMission() {
    setMissions((prev) => {
      setNewMissionIndex(prev.length)
      return [
        ...prev,
        {
          title: "",
          orderCount: 1,
          pickups: [{ location: "" }],
          deliveries: [{ location: "" }],
        },
      ]
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-text-dim">
            Phase 02
          </div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">
            Review parsed missions
          </h1>
          <p className="mt-2 max-w-[620px] text-sm text-muted-foreground">
            {missions.length} contract{missions.length !== 1 ? "s" : ""} parsed.
            Fix any OCR mistakes before continuing.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded border border-transparent bg-transparent px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => onBack(missions)}
          >
            <span className="font-mono">←</span> Back
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            onClick={addMission}
          >
            <span className="font-mono">+</span> Add mission
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={missions.length === 0}
            onClick={() => onNext(missions)}
          >
            Continue to planner <span className="font-mono opacity-70">→</span>
          </button>
        </div>
      </div>

      <div className="my-6 shrink-0 h-px bg-border" />

      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        {missions.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[10px] border border-border px-6 py-12 text-center text-sm text-text-dim">
            No missions to review. Go back and import some screenshots, or add
            one manually.
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              onClick={addMission}
            >
              <span className="font-mono">+</span> Add mission
            </button>
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
            }}
          >
            {missions.map((mission, i) => (
              <MissionCard
                // biome-ignore lint/suspicious/noArrayIndexKey: missions have no stable id; identified positionally throughout the app
                key={i}
                mission={mission}
                index={i}
                onUpdate={(updated) => updateMission(i, updated)}
                onRemove={() => removeMission(i)}
                defaultEditing={i === newMissionIndex}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
