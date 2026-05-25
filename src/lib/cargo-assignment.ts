import type { ShipLayout } from "@/data/cargo-grids";
import type { Stop } from "@/types";

export interface DeliveryGroup {
  stopIdx: number;
  location: string;
  totalScu: number;
}

/**
 * Computes delivery groups (per-stop totals) from the stop list.
 * Only stops with dropoffs are included. Sorted by stop order so earlier
 * deliveries sit at the front of the cargo hold.
 */
export function computeDeliveryGroups(stops: Stop[]): DeliveryGroup[] {
  return stops
    .map((stop, i) => ({
      stopIdx: i,
      location: stop.location,
      totalScu: stop.dropoffs.reduce((sum, d) => sum + (d.scu ?? 0), 0),
    }))
    .filter((g) => g.totalScu > 0);
  // NOTE: intentionally NOT sorted by size here — stop order is preserved so
  // the assignment algorithm can try largest-first for bin-packing while still
  // placing earlier deliveries towards the front when possible.
}

/**
 * Assigns delivery zones to the cargo grid as compact **rectangular batches**.
 *
 * For each group:
 *  1. Compute floor footprint: floorCells = ceil(totalScu / section.height)
 *  2. Find the most-square (w × l) rectangle with l ≥ w (lengthwise along ship).
 *     e.g. 21 SCU ÷ height 4 = 6 floor cells → 2 × 3 rectangle.
 *  3. Pack rectangles into the section using a shelf algorithm:
 *     place left-to-right in the current shelf; open a new shelf when the
 *     ideal rectangle no longer fits in the remaining horizontal space.
 *  4. Fall back to spilling across sections only when no single section fits.
 *
 * Returns a Map<"wx,wz", stopIdx> for every cell that got assigned.
 */
export function buildCargoAssignment(
  layout: ShipLayout,
  deliveryGroups: DeliveryGroup[],
): Map<string, number> {
  const result = new Map<string, number>();

  // Per-section shelf state: where in the section the next rect will go.
  interface Shelf { shelfZ: number; shelfH: number; nextX: number }
  const shelves: Shelf[] = layout.sections.map(() => ({
    shelfZ: 0,
    shelfH: 0,
    nextX: 0,
  }));

  // Process largest groups first so they get first pick of sections.
  const sorted = [...deliveryGroups].sort((a, b) => b.totalScu - a.totalScu);

  for (const group of sorted) {
    let placed = false;

    for (let si = 0; si < layout.sections.length && !placed; si++) {
      const s = layout.sections[si];
      const sh = shelves[si];
      const floorCells = Math.ceil(group.totalScu / s.height);

      // Ideal rect for the full section width (used as the target shape)
      const { w: wIdeal, l: lIdeal } = bestRect(floorCells, s.width);

      // ── Attempt 1: current shelf has enough horizontal space ──
      const xRem = s.width - sh.nextX;
      if (xRem >= wIdeal && sh.shelfZ + lIdeal <= s.length) {
        fillRect(result, s, sh.nextX, sh.shelfZ, wIdeal, lIdeal, group.stopIdx);
        sh.nextX += wIdeal;
        sh.shelfH = Math.max(sh.shelfH, lIdeal);
        placed = true;
        break;
      }

      // ── Attempt 2: open a new shelf ──
      if (sh.shelfH > 0) {
        const newZ = sh.shelfZ + sh.shelfH;
        if (newZ < s.length && lIdeal <= s.length - newZ) {
          sh.shelfZ = newZ;
          sh.shelfH = lIdeal;
          sh.nextX = wIdeal;
          fillRect(result, s, 0, newZ, wIdeal, lIdeal, group.stopIdx);
          placed = true;
          break;
        }
      }
    }

    // ── Fallback: row-by-row spill across sections ──
    if (!placed) {
      let remaining = group.totalScu;
      for (let si = 0; si < layout.sections.length && remaining > 0; si++) {
        const s = layout.sections[si];
        const sh = shelves[si];
        const newZ = sh.shelfZ + sh.shelfH;
        const availRows = s.length - newZ;
        if (availRows <= 0) continue;

        const rowsToUse = Math.min(
          availRows,
          Math.ceil(remaining / (s.width * s.height)),
        );
        for (let dz = 0; dz < rowsToUse; dz++) {
          for (let dx = 0; dx < s.width; dx++) {
            result.set(`${s.wx + dx},${s.wz + newZ + dz}`, group.stopIdx);
          }
        }
        sh.shelfZ = newZ + rowsToUse;
        sh.shelfH = 0;
        sh.nextX = 0;
        remaining -= rowsToUse * s.width * s.height;
      }
    }
  }

  return result;
}

/**
 * Find the most-square (w, l) rectangle for `floorCells` floor positions,
 * constrained to `maxW` columns.  Always returns l ≥ w (longer side runs
 * along the ship's z-axis = lengthwise).
 *
 * Strategy: increment w from 1; l = ceil(floorCells/w) decreases.
 * The closest-to-square pair is when l/w is minimised while l ≥ w.
 */
function bestRect(floorCells: number, maxW: number): { w: number; l: number } {
  let bw = 1;
  let bl = floorCells;
  let bestScore = Infinity;

  for (let w = 1; w <= maxW; w++) {
    const l = Math.ceil(floorCells / w);
    if (l < w) break; // beyond the square point — l/w would worsen
    const score = l / w; // 1.0 = perfect square
    if (score < bestScore) {
      bestScore = score;
      bw = w;
      bl = l;
    }
  }

  return { w: bw, l: bl };
}

/** Fill a w × l rectangle starting at (startX, startZ) within `section`. */
function fillRect(
  result: Map<string, number>,
  section: { wx: number; wz: number },
  startX: number,
  startZ: number,
  w: number,
  l: number,
  stopIdx: number,
): void {
  for (let dz = 0; dz < l; dz++) {
    const wz = section.wz + startZ + dz;
    for (let dx = 0; dx < w; dx++) {
      result.set(`${section.wx + startX + dx},${wz}`, stopIdx);
    }
  }
}

/**
 * For a pickup item (by missionIndex), determine which delivery zones it belongs to
 * and how many SCU should go into each zone.
 *
 * A mission may deliver to multiple stops; SCU is split proportionally.
 */
export function getPickupDestinations(
  missionIndex: number,
  pickupScu: number,
  stops: Stop[],
): Array<{ stopIdx: number; location: string; scu: number }> {
  const deliveries = stops
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.dropoffs.some((d) => d.missionIndex === missionIndex));

  if (deliveries.length === 0) return [];

  const totalDeliveryScu = deliveries.reduce(
    (sum, { s }) =>
      sum +
      s.dropoffs
        .filter((d) => d.missionIndex === missionIndex)
        .reduce((a, d) => a + (d.scu ?? 0), 0),
    0,
  );

  if (deliveries.length === 1 || totalDeliveryScu === 0) {
    return [{ stopIdx: deliveries[0].i, location: deliveries[0].s.location, scu: pickupScu }];
  }

  return deliveries.map(({ s, i }) => {
    const delivScu = s.dropoffs
      .filter((d) => d.missionIndex === missionIndex)
      .reduce((a, d) => a + (d.scu ?? 0), 0);
    return {
      stopIdx: i,
      location: s.location,
      scu: Math.round((delivScu / totalDeliveryScu) * pickupScu),
    };
  });
}
