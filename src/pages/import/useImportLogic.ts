import { useCallback, useState } from "react"
import { fileToScaledDataUrl } from "@/lib/image"
import type { ParsedMission, RegionConfig, UploadQueueItem } from "@/types"

export function useImportLogic(initialItems: UploadQueueItem[] = []) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [queue, setQueue] = useState<UploadQueueItem[]>(initialItems)

  const updateItem = useCallback(
    (id: string, patch: Partial<UploadQueueItem>) => {
      setQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      )
    },
    []
  )

  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"))
    setQueue((prev) => [
      ...prev,
      ...arr.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        filename: file.name,
        status: "queued" as const,
        file,
      })),
    ])
  }, [])

  const startParsing = useCallback(
    async (regions: RegionConfig) => {
      const toParse = queue.filter((i) => i.status === "queued" && i.file)
      for (const item of toParse) {
        if (!item.file) continue
        updateItem(item.id, { status: "parsing" })
        try {
          const formData = new FormData()
          formData.append("image", item.file)
          formData.append("regions", JSON.stringify(regions))

          const res = await fetch("/api/v1/missions/parse", {
            method: "POST",
            body: formData,
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)

          const result: ParsedMission = await res.json()
          let sourceImage: string | undefined
          try {
            sourceImage = await fileToScaledDataUrl(item.file)
          } catch {
            sourceImage = undefined
          }
          updateItem(item.id, {
            status: "ok",
            result: { ...result, sourceImage },
          })
        } catch {
          updateItem(item.id, { status: "error" })
        }
      }
    },
    [queue, updateItem]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragOver(false), [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const removeItem = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearQueue = useCallback(() => setQueue([]), [])

  const parsedMissions = queue
    .filter((i) => i.status === "ok" && i.result)
    .map((i) => i.result as ParsedMission)

  const referenceFile = queue.find((i) => i.file)?.file ?? null
  const queuedCount = queue.filter((i) => i.status === "queued").length
  const parsingCount = queue.filter((i) => i.status === "parsing").length
  const okCount = queue.filter((i) => i.status === "ok").length
  const errorCount = queue.filter((i) => i.status === "error").length

  return {
    isDragOver,
    queue,
    parsedMissions,
    referenceFile,
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
  }
}
