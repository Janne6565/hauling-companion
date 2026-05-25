import shipsRaw from "./ships.json"

export interface GridSection {
  /** World-space position (group offset + local offset) */
  wx: number
  wz: number
  width: number
  height: number // vertical stacking — each (wx,wz) column holds `height` SCU
  length: number
  maxSize?: number
  minSize?: number
}

export interface ShipLayout {
  name: string
  capacity: number
  sections: GridSection[]
  /** Bounding box of all sections combined */
  spanX: number
  spanZ: number
  /** True if the ship's Z dimension is wider than X (common for haulers) */
  landscape: boolean
}

type ShipEntry = {
  name: string
  alternativeNames?: string[]
  official?: {
    capacity: number
    groups: Array<{
      x?: number
      z?: number
      grids: Array<{
        x?: number
        y?: number
        z?: number
        width: number
        height: number
        length: number
        maxSize?: number
        minSize?: number
      }>
    }>
  }
}

function parseLayout(entry: ShipEntry): ShipLayout {
  const sections: GridSection[] = []

  for (const group of entry.official?.groups ?? []) {
    const gx = group.x ?? 0
    const gz = group.z ?? 0
    for (const grid of group.grids ?? []) {
      sections.push({
        wx: gx + (grid.x ?? 0),
        wz: gz + (grid.z ?? 0),
        width: grid.width,
        height: grid.height,
        length: grid.length,
        maxSize: grid.maxSize,
        minSize: grid.minSize,
      })
    }
  }

  const spanX = sections.reduce((m, s) => Math.max(m, s.wx + s.width), 0)
  const spanZ = sections.reduce((m, s) => Math.max(m, s.wz + s.length), 0)

  return {
    name: entry.name,
    capacity: entry.official?.capacity ?? 0,
    sections,
    spanX,
    spanZ,
    landscape: spanZ >= spanX,
  }
}

// Build lookup by lower-cased name (and alternative names)
const layoutMap = new Map<string, ShipLayout>()
for (const entry of shipsRaw as ShipEntry[]) {
  if (!entry.official) continue
  const layout = parseLayout(entry)
  layoutMap.set(entry.name.toLowerCase(), layout)
  for (const alt of entry.alternativeNames ?? []) {
    layoutMap.set(alt.toLowerCase(), layout)
  }
}

/** Look up a ship's cargo grid layout by its display label (e.g. "C2 Hercules"). */
export function getShipLayout(shipLabel: string): ShipLayout | null {
  return layoutMap.get(shipLabel.toLowerCase()) ?? null
}
