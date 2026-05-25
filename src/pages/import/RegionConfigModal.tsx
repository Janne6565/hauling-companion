import { useEffect, useMemo, useRef, useState } from "react";
import type { BoundingBox, RegionConfig } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  referenceFiles: File[];
  initialConfig: RegionConfig | null;
  onSave: (config: RegionConfig) => void;
  onClose: () => void;
}

type RegionKey = keyof RegionConfig;

const REGIONS: { key: RegionKey; label: string; color: string; hint: string }[] = [
  { key: "title",      label: "Title",      color: "#6366f1", hint: "Drag around the contract title" },
  { key: "reward",     label: "Reward",     color: "#22c55e", hint: "Drag around the UEC reward amount" },
  { key: "objectives", label: "Objectives", color: "#f59e0b", hint: "Drag around the Primary Objectives section" },
];

interface Point { x: number; y: number }

function normalizeBox(a: Point, b: Point): BoundingBox {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y),
  };
}

export function RegionConfigModal({ referenceFiles, initialConfig, onSave, onClose }: Props) {
  const [fileIndex, setFileIndex] = useState(0);
  const activeFile = referenceFiles[Math.min(fileIndex, referenceFiles.length - 1)];

  const imageUrl = useMemo(() => URL.createObjectURL(activeFile), [activeFile]);
  useEffect(() => () => URL.revokeObjectURL(imageUrl), [imageUrl]);

  const [activeKey, setActiveKey] = useState<RegionKey>("title");
  const [boxes, setBoxes] = useState<Partial<RegionConfig>>(initialConfig ?? {});
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<Point | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const getRelativePoint = (e: React.MouseEvent): Point => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const pt = getRelativePoint(e);
    setDrawStart(pt);
    setDrawCurrent(pt);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawStart) return;
    setDrawCurrent(getRelativePoint(e));
  };

  const commitDraw = (e: React.MouseEvent) => {
    if (!drawStart) return;
    const end = getRelativePoint(e);
    const box = normalizeBox(drawStart, end);
    if (box.w > 0.01 && box.h > 0.01) {
      const updated = { ...boxes, [activeKey]: box };
      setBoxes(updated);
      const nextRegion = REGIONS.find((r) => r.key !== activeKey && !updated[r.key]);
      if (nextRegion) setActiveKey(nextRegion.key);
    }
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const allSet = boxes.title != null && boxes.reward != null && boxes.objectives != null;
  const activeRegion = REGIONS.find((r) => r.key === activeKey)!;
  const liveBox = drawStart && drawCurrent ? normalizeBox(drawStart, drawCurrent) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-[92vw] max-w-5xl flex-col rounded-[12px] border border-border bg-surface shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-[15px] font-medium">Configure OCR Regions</div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              Drag on the screenshot to define each region. Saved per-browser in localStorage.
            </div>
          </div>
          <button className="font-mono text-[13px] text-text-dim hover:text-foreground" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* File switcher */}
        {referenceFiles.length > 1 && (
          <div className="flex items-center gap-3 border-b border-border px-5 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-dim">
              Reference image
            </span>
            <button
              disabled={fileIndex === 0}
              onClick={() => setFileIndex((i) => i - 1)}
              className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:border-border-strong hover:text-foreground disabled:opacity-30"
            >
              ←
            </button>
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
              {activeFile.name}
            </span>
            <span className="shrink-0 font-mono text-[10px] text-text-dim">
              {fileIndex + 1} / {referenceFiles.length}
            </span>
            <button
              disabled={fileIndex === referenceFiles.length - 1}
              onClick={() => setFileIndex((i) => i + 1)}
              className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:border-border-strong hover:text-foreground disabled:opacity-30"
            >
              →
            </button>
          </div>
        )}

        {/* Region tabs */}
        <div className="flex gap-2 border-b border-border px-5 py-3">
          {REGIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setActiveKey(r.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-[4px] border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors",
                activeKey === r.key
                  ? "border-transparent text-white"
                  : "border-border text-muted-foreground hover:border-border-strong",
              )}
              style={activeKey === r.key ? { background: r.color } : {}}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: boxes[r.key] ? r.color : "var(--border-strong)" }}
              />
              {r.label}
              {boxes[r.key] && <span className="opacity-70">✓</span>}
            </button>
          ))}
        </div>

        {/* Image canvas */}
        <div className="overflow-auto p-4" style={{ maxHeight: "58vh" }}>
          <div
            ref={containerRef}
            className="relative inline-block w-full cursor-crosshair select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={commitDraw}
            onMouseLeave={commitDraw}
          >
            <img
              src={imageUrl}
              alt="Reference screenshot"
              className="block w-full"
              draggable={false}
              style={{ pointerEvents: "none", userSelect: "none" }}
            />

            {REGIONS.map((r) => {
              const box = boxes[r.key];
              if (!box) return null;
              return (
                <div
                  key={r.key}
                  style={{
                    position: "absolute",
                    left: `${box.x * 100}%`,
                    top: `${box.y * 100}%`,
                    width: `${box.w * 100}%`,
                    height: `${box.h * 100}%`,
                    border: `2px solid ${r.color}`,
                    background: `${r.color}22`,
                    pointerEvents: "none",
                  }}
                >
                  <span
                    className="absolute left-1 top-0.5 font-mono text-[9px] font-bold uppercase"
                    style={{ color: r.color }}
                  >
                    {r.label}
                  </span>
                </div>
              );
            })}

            {liveBox && (
              <div
                style={{
                  position: "absolute",
                  left: `${liveBox.x * 100}%`,
                  top: `${liveBox.y * 100}%`,
                  width: `${liveBox.w * 100}%`,
                  height: `${liveBox.h * 100}%`,
                  border: `2px dashed ${activeRegion.color}`,
                  background: `${activeRegion.color}33`,
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        </div>

        {/* Instruction + footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <div className="text-[12px] text-muted-foreground">
            <span className="font-medium" style={{ color: activeRegion.color }}>
              {activeRegion.label}:
            </span>{" "}
            {activeRegion.hint}
            {boxes[activeKey] && (
              <button
                className="ml-2 font-mono text-[10px] text-text-dim underline hover:text-foreground"
                onClick={() => setBoxes((b) => { const c = { ...b }; delete c[activeKey]; return c; })}
              >
                redraw
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              className="rounded border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground hover:border-border-strong hover:text-foreground"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              disabled={!allSet}
              className="rounded px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: allSet ? "#6366f1" : undefined }}
              onClick={() => allSet && onSave(boxes as RegionConfig)}
            >
              Save Regions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
