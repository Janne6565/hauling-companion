import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

// Place your screenshots in public/walkthrough/
// e.g. public/walkthrough/01-import.png → /walkthrough/01-import.png

interface WalkthroughModalProps {
  open: boolean
  onClose: () => void
}

// ── Example data panels ────────────────────────────────────────────────────────

function MissionRow({
  title,
  reward,
  scu,
}: {
  title: string
  reward: string
  scu: number
}) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-[6px] border border-border bg-bg-2 px-2.5 py-2">
      <span className="text-[11px] leading-snug text-foreground">{title}</span>
      <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
        <span className="font-mono text-[10px] text-success">{reward}</span>
        <span className="font-mono text-[9.5px] text-text-dim">{scu} SCU</span>
      </div>
    </div>
  )
}

function ImportExample() {
  return (
    <div className="flex flex-col gap-1.5">
      <MissionRow
        title="Cargo delivery · Pyro to Stanton"
        reward="47,200 aUEC"
        scu={12}
      />
      <MissionRow
        title="Bulk haul · Orison to ArcCorp"
        reward="31,800 aUEC"
        scu={24}
      />
      <div className="flex items-center gap-1 pt-0.5">
        <span className="h-1 w-1 rounded-full bg-primary" />
        <span className="font-mono text-[9.5px] text-text-dim">
          2 missions extracted from 1 screenshot
        </span>
      </div>
    </div>
  )
}

function ReviewExample() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="rounded-[6px] border border-border bg-bg-2 px-2.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-foreground">
            Cargo delivery · Pyro to Stanton
          </span>
          <span className="rounded bg-success/10 px-1 py-0.5 font-mono text-[9px] text-success">
            OK
          </span>
        </div>
      </div>
      <div className="rounded-[6px] border border-[oklch(0.74_0.16_40)]/30 bg-[oklch(0.74_0.16_40)]/5 px-2.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="mb-0.5 font-mono text-[9px] uppercase tracking-widest text-[oklch(0.74_0.16_40)]">
              Reward corrected
            </div>
            <span className="text-[11px] text-foreground">
              Bulk haul · Orison to ArcCorp
            </span>
          </div>
          <span className="rounded bg-[oklch(0.74_0.16_40)]/10 px-1 py-0.5 font-mono text-[9px] text-[oklch(0.74_0.16_40)]">
            Edited
          </span>
        </div>
      </div>
    </div>
  )
}

function PlanExample() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <div className="flex-1 rounded-[6px] border border-border bg-bg-2 px-2 py-1.5">
          <div className="font-mono text-[9px] uppercase tracking-widest text-text-dim">
            Ship
          </div>
          <div className="mt-0.5 text-[11px] text-foreground">Caterpillar</div>
          <div className="font-mono text-[9.5px] text-text-dim">576 SCU</div>
        </div>
        <div className="flex-1 rounded-[6px] border border-border bg-bg-2 px-2 py-1.5">
          <div className="font-mono text-[9px] uppercase tracking-widest text-text-dim">
            Goal
          </div>
          <div className="mt-0.5 text-[11px] text-foreground">Profit</div>
          <div className="font-mono text-[9.5px] text-primary">4 stops</div>
        </div>
      </div>
      <div className="rounded-[6px] border border-primary/30 bg-primary/5 px-2.5 py-2">
        <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-primary">
          Optimized Result
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-foreground">142,500 aUEC</span>
          <span className="font-mono text-[10px] text-text-dim">
            4 stops · 3 missions
          </span>
        </div>
      </div>
    </div>
  )
}

function ContractExample() {
  return (
    <div className="flex flex-col gap-1.5">
      {[
        {
          title: "Cargo delivery · Pyro to Stanton",
          from: "Checkmate Station",
          to: "Port Tressler",
          reward: "47,200",
        },
        {
          title: "Bulk haul · Orison to ArcCorp",
          from: "Orison",
          to: "ArcCorp Hub",
          reward: "31,800",
        },
      ].map((m) => (
        <div
          key={m.title}
          className="rounded-[6px] border border-border bg-bg-2 px-2.5 py-2"
        >
          <div className="truncate text-[11px] text-foreground">{m.title}</div>
          <div className="mt-1 flex items-center gap-1 font-mono text-[9.5px] text-text-dim">
            <span>{m.from}</span>
            <span>→</span>
            <span>{m.to}</span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-success">
            {m.reward} aUEC
          </div>
        </div>
      ))}
    </div>
  )
}

function HaulExample() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="rounded-[6px] border border-primary/30 bg-primary/5 px-2.5 py-2">
        <div className="font-mono text-[9px] uppercase tracking-widest text-primary">
          Current Stop
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-foreground">
          <span>Orison</span>
          <span className="text-text-dim">→</span>
          <span>Port Tressler</span>
        </div>
      </div>
      <div className="rounded-[6px] border border-border bg-bg-2 px-2.5 py-2">
        <div className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-text-dim">
          Cargo checklist
        </div>
        <div className="flex flex-col gap-1">
          {[
            { label: "Medical Supplies · 4 SCU", done: true },
            { label: "Stims · 8 SCU", done: true },
            { label: "Food Packs · 12 SCU", done: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "font-mono text-[11px]",
                  item.done ? "text-success" : "text-text-dim"
                )}
              >
                {item.done ? "✓" : "○"}
              </span>
              <span
                className={cn(
                  "text-[10.5px]",
                  item.done
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                )}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Steps ──────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    label: "Import",
    description:
      "Drop screenshots of your in-game contract list. The OCR engine reads each image and extracts mission data automatically. Configure bounding boxes once to tell the app where titles, rewards, and objectives appear on screen.",
    imageSrc: "/walkthrough/01-import.png",
    exampleData: <ImportExample />,
    downloads: [
      { label: "Quartz A", href: "/examples/sc-contract-01.png" },
      { label: "Copper A", href: "/examples/sc-contract-02.png" },
      { label: "Silicon",  href: "/examples/sc-contract-03.png" },
      { label: "Quartz B", href: "/examples/sc-contract-04.png" },
      { label: "Copper B", href: "/examples/sc-contract-05.png" },
      { label: "Aluminum", href: "/examples/sc-contract-06.png" },
      { label: "Hydrogen A", href: "/examples/sc-contract-07.png" },
      { label: "Hydrogen B", href: "/examples/sc-contract-08.png" },
    ],
  },
  {
    num: "02",
    label: "Review",
    description:
      "Check all extracted missions and fix OCR mistakes inline. Remove contracts you don't want to take, or add missions manually. Every field is editable before you proceed to planning.",
    imageSrc: "/walkthrough/02-review.png",
    exampleData: <ReviewExample />,
  },
  {
    num: "03",
    label: "Plan",
    description:
      "Select your ship and optimization goal — maximize profit or XP. Set constraints like starting location, max stops, or interstellar travel. Click Optimize and the backend finds the best route through your missions.",
    imageSrc: "/walkthrough/03-plan.png",
    exampleData: <PlanExample />,
  },
  {
    num: "04",
    label: "Contract",
    description:
      "Review all selected contracts before heading in-game to accept them. Each mission shows its pickup and delivery locations so you know exactly what to look for in the contract manager.",
    imageSrc: "/walkthrough/04-contract.png",
    exampleData: <ContractExample />,
  },
  {
    num: "05",
    label: "Haul",
    description:
      "Track your haul in real time. Check off cargo as you load and deliver it stop by stop. The cargo grid shows how to pack your ship optimally so nothing gets left behind.",
    imageSrc: "/walkthrough/05-haul.png",
    exampleData: <HaulExample />,
  },
  {
    num: "05",
    label: "Haul — Fullscreen",
    description:
      "Hit Full Screen while hauling for a distraction-free view. The app chrome disappears and you get the stop list and cargo grid side by side — ideal for use on a second monitor or alongside the game.",
    imageSrc: "/walkthrough/06-haul-fullscreen.png",
    exampleData: <HaulExample />,
  },
]

// ── Modal ──────────────────────────────────────────────────────────────────────

export function WalkthroughModal({ open, onClose }: WalkthroughModalProps) {
  const [step, setStep] = useState(0)
  const [imgError, setImgError] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (lightbox) { setLightbox(false); return }
        onClose()
      }
      if (lightbox) return
      if (e.key === "ArrowRight") {
        setStep((s) => Math.min(s + 1, STEPS.length - 1))
        setImgError(false)
      }
      if (e.key === "ArrowLeft") {
        setStep((s) => Math.max(s - 1, 0))
        setImgError(false)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose, lightbox])

  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  if (!open) return null

  const current = STEPS[step]

  return (
    <>
    {lightbox && (
      <button
        type="button"
        className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-black/95 p-6"
        onClick={() => setLightbox(false)}
        aria-label="Close fullscreen"
      >
        <img
          src={current.imageSrc}
          alt={`Phase ${current.num} — ${current.label} fullscreen`}
          className="max-h-full max-w-full object-contain"
        />
      </button>
    )}
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-[90vw] max-w-4xl flex-col rounded-[12px] border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-3.5">
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-text-dim">
            Walkthrough
          </span>
          <span className="text-text-dim opacity-30">·</span>
          <span className="font-mono text-[11px] font-medium tracking-[0.06em] uppercase">
            Phase {current.num} — {current.label}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="font-mono text-[10px] text-text-dim">
              {step + 1} / {STEPS.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="grid h-[22px] w-[22px] place-items-center rounded font-mono text-sm text-text-dim transition-colors hover:text-foreground"
              aria-label="Close walkthrough"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex gap-5 p-5">
          {/* Screenshot */}
          <div
            className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[8px] border border-border bg-bg-2"
            style={{ minHeight: 260 }}
          >
            {!imgError ? (
              <button
                type="button"
                className="h-full w-full cursor-zoom-in"
                onClick={() => setLightbox(true)}
                aria-label="View fullscreen"
              >
                <img
                  src={current.imageSrc}
                  alt={`Phase ${current.num} — ${current.label}`}
                  className="h-full w-full object-contain"
                  onError={() => setImgError(true)}
                />
              </button>
            ) : (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-dim opacity-50">
                  No screenshot
                </span>
                <span className="break-all font-mono text-[9.5px] text-text-dim opacity-30">
                  public/walkthrough/{current.num}-{current.label.toLowerCase()}
                  .png
                </span>
              </div>
            )}
          </div>

          {/* Description + Example data */}
          <div className="flex w-[260px] flex-shrink-0 flex-col gap-4">
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              {current.description}
            </p>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-dim">
                Example
              </span>
              {current.exampleData}
            </div>
            {"downloads" in current && current.downloads && (
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-dim">
                  Sample screenshots
                </span>
                <div className="flex flex-wrap gap-1">
                  {current.downloads.map((d: { label: string; href: string }) => (
                    <a
                      key={d.href}
                      href={d.href}
                      download
                      className="rounded border border-border px-2 py-0.5 font-mono text-[9.5px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                    >
                      ↓ {d.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => { setStep(i); setImgError(false) }}
                aria-label={`Step ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-border hover:bg-muted-foreground"
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setStep((s) => Math.max(s - 1, 0)); setImgError(false) }}
              disabled={step === 0}
              className="rounded border border-border px-3.5 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Prev
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => { setStep((s) => s + 1); setImgError(false) }}
                className="rounded bg-primary px-3.5 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase text-primary-foreground transition-opacity hover:opacity-90"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded bg-primary px-3.5 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase text-primary-foreground transition-opacity hover:opacity-90"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
