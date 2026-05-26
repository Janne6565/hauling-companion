import { useEffect } from "react"
import type { ParsedMission } from "@/types"
import { MissionCard } from "./mission-card"

interface Props {
  missions: ParsedMission[]
  activeIndex: number
  onChangeIndex: (index: number) => void
  onClose: () => void
  onUpdate: (index: number, updated: ParsedMission) => void
  onRemove: (index: number) => void
}

export function ScreenshotLightbox({
  missions,
  activeIndex,
  onChangeIndex,
  onClose,
  onUpdate,
  onRemove,
}: Props) {
  const imageIndices = missions
    .map((m, i) => (m.sourceImage ? i : -1))
    .filter((i) => i >= 0)
  const pos = imageIndices.indexOf(activeIndex)
  const prevIndex = pos > 0 ? imageIndices[pos - 1] : null
  const nextIndex =
    pos >= 0 && pos < imageIndices.length - 1 ? imageIndices[pos + 1] : null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft" && prevIndex != null)
        onChangeIndex(prevIndex)
      else if (e.key === "ArrowRight" && nextIndex != null)
        onChangeIndex(nextIndex)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, onChangeIndex, prevIndex, nextIndex])

  const mission = missions[activeIndex]
  if (!mission) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <button
        type="button"
        aria-label="Close screenshot"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-[12px] border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-dim">
              Source screenshot
              {imageIndices.length > 1 && pos >= 0
                ? ` · ${pos + 1} / ${imageIndices.length}`
                : ""}
            </div>
            <div className="truncate text-[14px] font-medium">
              {mission.title || "Untitled mission"}
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 font-mono text-[13px] text-text-dim hover:text-foreground"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Body: screenshot (with nav) + editable mission card */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-auto bg-black/30 p-4">
            {mission.sourceImage ? (
              <img
                src={mission.sourceImage}
                alt={`Screenshot for ${mission.title || "mission"}`}
                className="max-h-full w-auto max-w-full rounded object-contain"
              />
            ) : (
              <div className="text-sm text-text-dim">
                No screenshot for this mission.
              </div>
            )}

            {prevIndex != null && (
              <button
                type="button"
                aria-label="Previous screenshot"
                onClick={() => onChangeIndex(prevIndex)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-surface/90 px-3 py-2 font-mono text-[14px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                ←
              </button>
            )}
            {nextIndex != null && (
              <button
                type="button"
                aria-label="Next screenshot"
                onClick={() => onChangeIndex(nextIndex)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-surface/90 px-3 py-2 font-mono text-[14px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                →
              </button>
            )}
          </div>

          <div className="w-full shrink-0 overflow-y-auto border-t border-border p-4 md:w-[360px] md:border-l md:border-t-0">
            <MissionCard
              key={activeIndex}
              mission={mission}
              index={activeIndex}
              onUpdate={(updated) => onUpdate(activeIndex, updated)}
              onRemove={() => onRemove(activeIndex)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
