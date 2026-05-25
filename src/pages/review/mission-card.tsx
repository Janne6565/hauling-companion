import { useId, useState } from "react"
import { cn } from "@/lib/utils"
import { MISSION_COLORS, type MissionLeg, type ParsedMission } from "@/types"

interface MissionCardProps {
  mission: ParsedMission
  index: number
  onUpdate: (updated: ParsedMission) => void
  onRemove: () => void
  defaultEditing?: boolean
}

export function MissionCard({
  mission,
  index,
  onUpdate,
  onRemove,
  defaultEditing = false,
}: MissionCardProps) {
  const [editing, setEditing] = useState(defaultEditing)
  const [draft, setDraft] = useState<ParsedMission>(mission)

  const color = MISSION_COLORS[index % MISSION_COLORS.length]
  const hasXp = mission.xp != null && mission.xp > 0
  const collapsedPickups = collapseLegs(mission.pickups)
  const collapsedDeliveries = collapseLegs(mission.deliveries)

  function commitEdit() {
    onUpdate(draft)
    setEditing(false)
  }

  function fmtNum(n?: number) {
    return n == null ? "—" : n.toLocaleString("en-US")
  }

  if (editing) {
    return (
      <div
        className="relative flex flex-col gap-3.5 overflow-hidden rounded-[10px] border border-border bg-surface p-[18px]"
        style={{ "--mc": color } as React.CSSProperties}
      >
        <div
          className="absolute bottom-0 left-0 top-0 w-[3px]"
          style={{ background: color }}
        />
        <div className="text-[13px] font-medium uppercase tracking-[0.06em] text-muted-foreground font-mono">
          Editing
        </div>
        <div className="flex flex-col gap-3">
          <Field
            label="Title"
            value={draft.title}
            onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="Reward (aUEC)"
              value={String(draft.rewardUec ?? "")}
              onChange={(v) =>
                setDraft((d) => ({
                  ...d,
                  rewardUec: parseInt(v, 10) || undefined,
                }))
              }
            />
            <Field
              label="Cargo type"
              value={draft.cargoType ?? ""}
              onChange={(v) => setDraft((d) => ({ ...d, cargoType: v }))}
            />
          </div>

          {/* Pickups */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-text-dim">
                Pickups
              </span>
              <button
                type="button"
                className="font-mono text-[10px] text-primary hover:opacity-80"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    pickups: [...d.pickups, { location: "" }],
                  }))
                }
              >
                + Add
              </button>
            </div>
            {draft.pickups.map((p, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: editable rows have no stable id and can be empty
                key={i}
                className="flex gap-1.5"
              >
                <div className="flex-1">
                  <Field
                    label=""
                    placeholder="Location"
                    value={p.location}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        pickups: d.pickups.map((x, j) =>
                          j === i ? { ...x, location: v } : x
                        ),
                      }))
                    }
                  />
                </div>
                <div className="flex-1">
                  <Field
                    label=""
                    placeholder="Cargo"
                    value={p.cargoType ?? ""}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        pickups: d.pickups.map((x, j) =>
                          j === i ? { ...x, cargoType: v || undefined } : x
                        ),
                      }))
                    }
                  />
                </div>
                <div className="w-16 shrink-0">
                  <Field
                    label=""
                    placeholder="SCU"
                    value={String(p.scu ?? "")}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        pickups: d.pickups.map((x, j) =>
                          j === i
                            ? { ...x, scu: parseInt(v, 10) || undefined }
                            : x
                        ),
                      }))
                    }
                  />
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded border border-border px-2 font-mono text-[11px] text-text-dim hover:border-border-strong hover:text-danger"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      pickups: d.pickups.filter((_, j) => j !== i),
                    }))
                  }
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Deliveries */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-text-dim">
                Dropoffs
              </span>
              <button
                type="button"
                className="font-mono text-[10px] text-primary hover:opacity-80"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    deliveries: [
                      ...d.deliveries,
                      { location: "", scu: undefined },
                    ],
                  }))
                }
              >
                + Add
              </button>
            </div>
            {draft.deliveries.map((d, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: editable rows have no stable id and can be empty
                key={i}
                className="flex gap-1.5"
              >
                <div className="flex-1">
                  <Field
                    label=""
                    placeholder="Location"
                    value={d.location}
                    onChange={(v) =>
                      setDraft((prev) => ({
                        ...prev,
                        deliveries: prev.deliveries.map((x, j) =>
                          j === i ? { ...x, location: v } : x
                        ),
                      }))
                    }
                  />
                </div>
                <div className="flex-1">
                  <Field
                    label=""
                    placeholder="Cargo"
                    value={d.cargoType ?? ""}
                    onChange={(v) =>
                      setDraft((prev) => ({
                        ...prev,
                        deliveries: prev.deliveries.map((x, j) =>
                          j === i ? { ...x, cargoType: v || undefined } : x
                        ),
                      }))
                    }
                  />
                </div>
                <div className="w-16 shrink-0">
                  <Field
                    label=""
                    placeholder="SCU"
                    value={String(d.scu ?? "")}
                    onChange={(v) =>
                      setDraft((prev) => ({
                        ...prev,
                        deliveries: prev.deliveries.map((x, j) =>
                          j === i
                            ? { ...x, scu: parseInt(v, 10) || undefined }
                            : x
                        ),
                      }))
                    }
                  />
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded border border-border px-2 font-mono text-[11px] text-text-dim hover:border-border-strong hover:text-danger"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      deliveries: prev.deliveries.filter((_, j) => j !== i),
                    }))
                  }
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            className="rounded border border-primary bg-primary px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-primary-foreground transition-opacity hover:opacity-90"
            onClick={commitEdit}
          >
            Save
          </button>
          <button
            type="button"
            className="rounded border border-border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            onClick={() => {
              setDraft(mission)
              setEditing(false)
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative flex flex-col gap-3.5 overflow-hidden rounded-[10px] border border-border bg-surface p-[18px]"
      style={{ "--mc": color } as React.CSSProperties}
    >
      <div
        className="absolute bottom-0 left-0 top-0 w-[3px]"
        style={{ background: color }}
      />

      <div className="flex items-start justify-between gap-2.5">
        <div>
          <div className="text-[15px] font-medium leading-snug">
            {mission.title}
          </div>
          {mission.cargoType && (
            <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
              {mission.cargoType}
            </div>
          )}
        </div>
        <div
          className={cn(
            "shrink-0 rounded-[3px] border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em]",
            hasXp
              ? "border-[oklch(0.50_0.10_150)] text-success"
              : "border-border text-muted-foreground"
          )}
        >
          {hasXp ? "✓ XP FOUND" : "NO XP MATCH"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="Reward" value={`${fmtNum(mission.rewardUec)} aUEC`} big />
        <Stat label="XP" value={fmtNum(mission.xp)} big />
        <Stat label="Orders" value={String(mission.orderCount)} />
        {mission.cargoType && <Stat label="Cargo" value={mission.cargoType} />}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border pt-2.5">
        {mission.pickups.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-dim">
              Pickup
              {collapsedPickups.length > 1
                ? `s · ${collapsedPickups.length}`
                : ""}
            </div>
            {collapsedPickups.map((p) => (
              <div
                key={`${p.location}|${p.cargoType ?? ""}`}
                className="grid items-start gap-2.5"
                style={{ gridTemplateColumns: "16px 1fr auto" }}
              >
                <div className="ml-1 mt-[5px] h-2 w-2 shrink-0 rounded-full bg-muted-foreground" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px]">{p.location}</span>
                  {(p.cargoType ?? mission.cargoType) && (
                    <span className="font-mono text-[10.5px] text-text-dim">
                      {p.cargoType ?? mission.cargoType}
                    </span>
                  )}
                </div>
                {p.scu != null && (
                  <span className="mt-[2px] font-mono text-[11px] font-medium text-muted-foreground shrink-0">
                    {p.scu} SCU
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {mission.deliveries.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-dim">
              Dropoff
              {collapsedDeliveries.length > 1
                ? `s · ${collapsedDeliveries.length}`
                : ""}
            </div>
            {collapsedDeliveries.map((d) => (
              <div
                key={`${d.location}|${d.cargoType ?? ""}`}
                className="grid items-start gap-2.5"
                style={{ gridTemplateColumns: "16px 1fr auto" }}
              >
                <div
                  className="ml-1 mt-[5px] h-2 w-2 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px]">{d.location}</span>
                  {(d.cargoType ?? mission.cargoType) && (
                    <span className="font-mono text-[10.5px] text-text-dim">
                      {d.cargoType ?? mission.cargoType}
                    </span>
                  )}
                </div>
                {d.scu != null && (
                  <span className="mt-[2px] font-mono text-[11px] font-medium text-muted-foreground shrink-0">
                    {d.scu} SCU
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-1 flex gap-2">
        <button
          type="button"
          className="rounded-[3px] border border-border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.04em] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
        <button
          type="button"
          className="rounded-[3px] border border-border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.04em] text-muted-foreground transition-colors hover:border-border-strong hover:text-danger"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
    </div>
  )
}

function collapseLegs(legs: MissionLeg[]): MissionLeg[] {
  const map = new Map<string, MissionLeg>()
  for (const leg of legs) {
    const key = `${leg.location}|${leg.cargoType ?? ""}`
    const existing = map.get(key)
    if (existing) {
      map.set(key, {
        ...existing,
        scu:
          existing.scu != null || leg.scu != null
            ? (existing.scu ?? 0) + (leg.scu ?? 0)
            : undefined,
      })
    } else {
      map.set(key, { ...leg })
    }
  }
  return Array.from(map.values())
}

function Stat({
  label,
  value,
  big,
}: {
  label: string
  value: string
  big?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-text-dim">
        {label}
      </span>
      <span className={cn("font-mono", big ? "text-[18px]" : "text-[14px]")}>
        {value}
      </span>
    </div>
  )
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1 flex-1">
      {label && (
        <label
          htmlFor={id}
          className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-text-dim"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className="w-full rounded border border-border bg-input px-2.5 py-1.5 font-mono text-[12px] text-foreground outline-none transition-colors focus:border-primary"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
