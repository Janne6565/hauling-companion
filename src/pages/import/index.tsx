import { useEffect, useMemo, useRef, useState } from "react";
import type { ParsedMission, RegionConfig, UploadQueueItem } from "@/types";
import { cn } from "@/lib/utils";
import { useImportLogic } from "./useImportLogic";
import { RegionConfigModal } from "./RegionConfigModal";

const REGIONS_KEY = "hauler_ocr_regions";

function loadRegionConfig(): RegionConfig | null {
  try {
    const raw = localStorage.getItem(REGIONS_KEY);
    return raw ? (JSON.parse(raw) as RegionConfig) : null;
  } catch {
    return null;
  }
}

function saveRegionConfig(config: RegionConfig) {
  localStorage.setItem(REGIONS_KEY, JSON.stringify(config));
}

interface ImportScreenProps {
  onNext: (missions: ParsedMission[]) => void;
  initialMissions?: ParsedMission[];
}

export function ImportScreen({ onNext, initialMissions = [] }: ImportScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [regionConfig, setRegionConfig] = useState<RegionConfig | null>(loadRegionConfig);
  const [showModal, setShowModal] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  // Restore queue from previously reviewed missions (no file objects — they're gone)
  const initialItems = useMemo<UploadQueueItem[]>(
    () =>
      initialMissions.map((m, i) => ({
        id: `restored-${i}`,
        filename: m.title,
        status: "ok" as const,
        result: m,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // only run on mount
  );

  const {
    isDragOver,
    queue,
    parsedMissions,
    queuedCount,
    parsingCount,
    okCount,
    errorCount,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFiles,
    removeItem,
    clearQueue,
    startParsing,
  } = useImportLogic(initialItems);

  // All files currently in queue (for image switcher in region modal)
  const queueFiles = useMemo(
    () => queue.flatMap((i) => (i.file ? [i.file] : [])),
    [queue],
  );

  // Full-screen preview URL — created/revoked as previewFile changes
  const previewUrl = useMemo(
    () => (previewFile ? URL.createObjectURL(previewFile) : null),
    [previewFile],
  );
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const isCurrentlyParsing = isParsing || parsingCount > 0;
  const canParse = regionConfig != null && queuedCount > 0 && !isCurrentlyParsing;

  const buttonPhase: "parse" | "parsing" | "review" =
    isCurrentlyParsing ? "parsing"
    : parsedMissions.length > 0 && queuedCount === 0 ? "review"
    : "parse";

  // Show "Back to Review" when there are existing results AND new items still queued
  const showBackToReview = parsedMissions.length > 0 && queuedCount > 0;

  async function handleParseClick() {
    if (!regionConfig || !canParse) return;
    setIsParsing(true);
    await startParsing(regionConfig);
    setIsParsing(false);
  }

  function handleSaveRegions(config: RegionConfig) {
    saveRegionConfig(config);
    setRegionConfig(config);
    setShowModal(false);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Region config modal */}
      {showModal && queueFiles.length > 0 && (
        <RegionConfigModal
          referenceFiles={queueFiles}
          initialConfig={regionConfig}
          onSave={handleSaveRegions}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Full-screen image preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/90"
          onClick={() => setPreviewFile(null)}
        >
          <img
            src={previewUrl}
            alt="Screenshot preview"
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
          <button
            className="absolute right-5 top-5 rounded border border-white/20 bg-black/50 px-3 py-1.5 font-mono text-[11px] text-white hover:bg-black/70"
            onClick={() => setPreviewFile(null)}
          >
            ✕ Close
          </button>
        </div>
      )}

      <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-text-dim">
        Phase 01
      </div>
      <h1 className="mt-1 text-2xl font-medium tracking-tight">
        Import contract screenshots
      </h1>
      <p className="mt-2 max-w-[620px] text-sm text-muted-foreground">
        Drop screenshots of your in-game contract list. Configure OCR regions
        once, then parse all screenshots in one click.
      </p>

      <div className="my-6 h-px bg-border" />

      <div className="grid min-h-0 flex-1 grid-cols-[1.2fr_1fr] gap-8 max-[1100px]:grid-cols-1">
        {/* Drop zone */}
        <div
          className={cn(
            "relative flex flex-col items-center justify-center rounded-[10px] px-8 py-8 text-center transition-colors",
            "border-[1.5px] border-dashed",
            isDragOver
              ? "border-primary dropzone-hatch-active"
              : "border-border-strong dropzone-hatch",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            className="mx-auto mb-[18px] grid h-14 w-14 place-items-center rounded font-mono text-[22px] text-muted-foreground"
            style={{ border: "1.5px solid var(--border-strong)" }}
          >
            ⤓
          </div>
          <div className="text-[17px] font-medium">Drop screenshots here</div>
          <div className="mt-2 text-sm text-muted-foreground">
            PNG or JPG · multi-file · up to 50
          </div>

          <div className="mt-5 flex items-center justify-center gap-3.5 font-mono text-[11px] tracking-[0.1em] text-text-dim">
            <span className="h-px w-20 bg-border" />
            OR
            <span className="h-px w-20 bg-border" />
          </div>

          <div className="mt-4 flex justify-center">
            <button
              className="inline-flex items-center gap-2 rounded border border-border bg-surface px-4 py-2 text-[13px] font-medium transition-colors hover:border-border-strong hover:bg-surface-2"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse files
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {/* Upload queue */}
        <div className="flex min-h-0 flex-col">
          <div className="mb-3 shrink-0 flex items-center gap-2.5 text-[13px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
            Queue ({queue.length})
            {queue.length > 0 && (
              <span className="font-mono text-[10px] tracking-[0.08em] text-text-dim">
                {queuedCount > 0 && `${queuedCount} QUEUED`}
                {parsingCount > 0 && ` · ${parsingCount} PARSING`}
                {okCount > 0 && ` · ${okCount} DONE`}
                {errorCount > 0 && ` · ${errorCount} FAILED`}
              </span>
            )}
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="ml-auto font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim hover:text-danger transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="rounded-[10px] border border-border px-5 py-8 text-center text-sm text-text-dim">
              No screenshots yet — drop some above.
            </div>
          ) : (
            <div className="flex flex-1 min-h-0 flex-col gap-2.5 overflow-y-auto pb-4">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="grid items-center gap-3.5 rounded border border-border bg-surface px-3.5 py-2.5"
                  style={{ gridTemplateColumns: "36px 1fr auto" }}
                >
                  {/* Thumbnail — clickable if file is available */}
                  <div
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-[4px] border border-border font-mono text-[10px] text-text-dim",
                      item.file && "cursor-zoom-in hover:border-border-strong",
                    )}
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.30 0.02 200), oklch(0.18 0.01 250))",
                    }}
                    onClick={() => item.file && setPreviewFile(item.file)}
                    title={item.file ? "Click to preview" : undefined}
                  >
                    SS
                  </div>

                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="truncate text-[13px]">{item.filename}</div>
                    <div
                      className={cn(
                        "font-mono text-[10.5px] tracking-[0.06em]",
                        item.status === "ok" && "text-success",
                        item.status === "error" && "text-danger",
                        (item.status === "queued" || item.status === "parsing") &&
                          "text-muted-foreground",
                      )}
                    >
                      {item.status === "ok" && "✓ PARSED"}
                      {item.status === "error" && "⚠ FAILED"}
                      {item.status === "parsing" && "· PARSING…"}
                      {item.status === "queued" && "· QUEUED"}
                    </div>
                  </div>

                  <button
                    className="font-mono text-[11px] text-text-dim hover:text-foreground"
                    onClick={() => removeItem(item.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Configure Regions */}
      <div className="mt-8 shrink-0 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium">OCR Regions</div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              {regionConfig
                ? "Regions configured — click to adjust."
                : "Not configured — required before parsing."}
            </div>
          </div>
          <div className="group relative">
            <button
              disabled={queueFiles.length === 0}
              onClick={() => setShowModal(true)}
              className={cn(
                "rounded border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors",
                queueFiles.length > 0
                  ? regionConfig
                    ? "border-[oklch(0.50_0.10_150)] text-success hover:bg-success/10"
                    : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
                  : "cursor-not-allowed border-border text-text-dim opacity-50",
              )}
            >
              {regionConfig ? "✓ Regions set · Edit" : "Configure Regions"}
            </button>
            {queueFiles.length === 0 && (
              <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-max max-w-[220px] rounded border border-border bg-surface-2 px-2.5 py-1.5 text-[11px] text-muted-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                Please upload a screenshot as a reference image
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="mt-6 shrink-0 flex justify-end gap-3">
        <button
          className="inline-flex items-center gap-2 rounded border border-transparent bg-transparent px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => onNext([])}
        >
          Skip — enter manually
        </button>

        {showBackToReview && (
          <button
            className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            onClick={() => onNext(parsedMissions)}
          >
            <span className="font-mono opacity-70">→</span> Back to Review
          </button>
        )}

        {buttonPhase === "review" ? (
          <button
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            onClick={() => onNext(parsedMissions)}
          >
            Review {parsedMissions.length} mission{parsedMissions.length !== 1 ? "s" : ""}
            <span className="font-mono opacity-70">→</span>
          </button>
        ) : (
          <button
            disabled={!canParse}
            onClick={handleParseClick}
            className={cn(
              "inline-flex items-center gap-2 rounded px-4 py-2 text-[13px] font-semibold transition-colors",
              canParse
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "cursor-not-allowed bg-surface text-muted-foreground",
            )}
          >
            {buttonPhase === "parsing"
              ? "Parsing…"
              : `Parse ${queuedCount} screenshot${queuedCount !== 1 ? "s" : ""}`}
          </button>
        )}
      </div>
    </div>
  );
}
