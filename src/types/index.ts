export type ParseStatus = "queued" | "parsing" | "ok" | "error"

export interface MissionLeg {
  location: string
  body?: string
  scu?: number
  cargoType?: string
}

export interface ParsedMission {
  title: string
  rewardUec?: number
  xp?: number
  cargoType?: string
  orderCount: number
  pickups: MissionLeg[]
  deliveries: MissionLeg[]
  rawOcrText?: string
  // Downscaled JPEG data URL of the screenshot this mission was parsed from.
  sourceImage?: string
}

export interface BoundingBox {
  x: number
  y: number
  w: number
  h: number
}

export interface RegionConfig {
  title: BoundingBox
  reward: BoundingBox
  objectives: BoundingBox
}

export interface UploadQueueItem {
  id: string
  filename: string
  status: ParseStatus
  file?: File
  result?: ParsedMission
}

export type Phase = "import" | "review" | "plan" | "contract" | "haul" | "done"

export interface PhaseConfig {
  id: Phase
  num: string
  label: string
}

export const PHASES: PhaseConfig[] = [
  { id: "import", num: "01", label: "Import" },
  { id: "review", num: "02", label: "Review" },
  { id: "plan", num: "03", label: "Plan" },
  { id: "contract", num: "04", label: "Contract" },
  { id: "haul", num: "05", label: "Haul" },
  { id: "done", num: "06", label: "Complete" },
]

// ── Phase 2 — Optimization types ─────────────────────────────────────────────

export interface LocationDto {
  name: string
  parentBody?: string
  system?: string
}

export type LockState = "default" | "force_in" | "force_out"

export type OptimizeGoal = "PROFIT" | "XP"

export interface ShipConfig {
  id: string
  label: string
  manufacturer: string
  capacity: number
}

export const SHIPS: ShipConfig[] = [
  {
    id: "AVENGER_TITAN",
    label: "Avenger Titan",
    manufacturer: "Aegis",
    capacity: 8,
  },
  {
    id: "HAMMERHEAD",
    label: "Hammerhead",
    manufacturer: "Aegis",
    capacity: 64,
  },
  { id: "IDRIS_M", label: "Idris-M", manufacturer: "Aegis", capacity: 1326 },
  { id: "IDRIS_P", label: "Idris-P", manufacturer: "Aegis", capacity: 1374 },
  { id: "RECLAIMER", label: "Reclaimer", manufacturer: "Aegis", capacity: 420 },
  { id: "REDEEMER", label: "Redeemer", manufacturer: "Aegis", capacity: 2 },
  {
    id: "RETALIATOR",
    label: "Retaliator",
    manufacturer: "Aegis",
    capacity: 74,
  },
  { id: "TIBURON", label: "Tiburon", manufacturer: "Aegis", capacity: 64 },
  { id: "ASGARD", label: "Asgard", manufacturer: "Anvil", capacity: 180 },
  { id: "C8_PISCES", label: "C8 Pisces", manufacturer: "Anvil", capacity: 4 },
  { id: "C8X_PISCES", label: "C8X Pisces", manufacturer: "Anvil", capacity: 4 },
  { id: "CARRACK", label: "Carrack", manufacturer: "Anvil", capacity: 456 },
  {
    id: "F7C_HORNET_MK_I",
    label: "F7C Hornet (Mk I)",
    manufacturer: "Anvil",
    capacity: 2,
  },
  {
    id: "F7C_HORNET_MK_II",
    label: "F7C Hornet (Mk II)",
    manufacturer: "Anvil",
    capacity: 2,
  },
  {
    id: "LIBERATOR_CONCEPT",
    label: "Liberator [Concept]",
    manufacturer: "Anvil",
    capacity: 400,
  },
  { id: "PALADIN", label: "Paladin", manufacturer: "Anvil", capacity: 4 },
  { id: "VALKYRIE", label: "Valkyrie", manufacturer: "Anvil", capacity: 90 },
  { id: "CSV_SM", label: "CSV-SM", manufacturer: "Argo", capacity: 4 },
  { id: "MOLE", label: "MOLE", manufacturer: "Argo", capacity: 32 },
  { id: "MOTH", label: "MOTH", manufacturer: "Argo", capacity: 224 },
  { id: "MPUV_C", label: "MPUV-C", manufacturer: "Argo", capacity: 2 },
  { id: "MPUV_T", label: "MPUV-T", manufacturer: "Argo", capacity: 16 },
  { id: "RAFT", label: "Raft", manufacturer: "Argo", capacity: 192 },
  { id: "SRV", label: "SRV", manufacturer: "Argo", capacity: 12 },
  {
    id: "MERCHANTMAN_CONCEPT",
    label: "Merchantman [Concept]",
    manufacturer: "Banu",
    capacity: 2880,
  },
  {
    id: "MUSTANG_ALPHA",
    label: "Mustang Alpha",
    manufacturer: "Consolidated Outland",
    capacity: 4,
  },
  {
    id: "NOMAD",
    label: "Nomad",
    manufacturer: "Consolidated Outland",
    capacity: 24,
  },
  {
    id: "PIONEER_CONCEPT",
    label: "Pioneer [Concept]",
    manufacturer: "Consolidated Outland",
    capacity: 1000,
  },
  {
    id: "A2_HERCULES",
    label: "A2 Hercules",
    manufacturer: "Crusader",
    capacity: 216,
  },
  {
    id: "C1_SPIRIT",
    label: "C1 Spirit",
    manufacturer: "Crusader",
    capacity: 64,
  },
  {
    id: "C2_HERCULES",
    label: "C2 Hercules",
    manufacturer: "Crusader",
    capacity: 696,
  },
  { id: "INTREPID", label: "Intrepid", manufacturer: "Crusader", capacity: 8 },
  {
    id: "M2_HERCULES",
    label: "M2 Hercules",
    manufacturer: "Crusader",
    capacity: 522,
  },
  {
    id: "MERCURY_STAR_RUNNER",
    label: "Mercury Star Runner",
    manufacturer: "Crusader",
    capacity: 114,
  },
  {
    id: "CATERPILLAR",
    label: "Caterpillar",
    manufacturer: "Drake",
    capacity: 576,
  },
  { id: "CLIPPER", label: "Clipper", manufacturer: "Drake", capacity: 12 },
  { id: "CORSAIR", label: "Corsair", manufacturer: "Drake", capacity: 72 },
  {
    id: "CUTLASS_BLACK",
    label: "Cutlass Black",
    manufacturer: "Drake",
    capacity: 46,
  },
  {
    id: "CUTLASS_BLUE",
    label: "Cutlass Blue",
    manufacturer: "Drake",
    capacity: 12,
  },
  {
    id: "CUTLASS_RED",
    label: "Cutlass Red",
    manufacturer: "Drake",
    capacity: 12,
  },
  { id: "CUTTER", label: "Cutter", manufacturer: "Drake", capacity: 4 },
  {
    id: "CUTTER_RAMBLER",
    label: "Cutter Rambler",
    manufacturer: "Drake",
    capacity: 2,
  },
  {
    id: "CUTTER_SCOUT",
    label: "Cutter Scout",
    manufacturer: "Drake",
    capacity: 2,
  },
  { id: "GOLEM_OX", label: "Golem Ox", manufacturer: "Drake", capacity: 64 },
  { id: "IRONCLAD", label: "Ironclad", manufacturer: "Drake", capacity: 2200 },
  {
    id: "IRONCLAD_ASSAULT",
    label: "Ironclad Assault",
    manufacturer: "Drake",
    capacity: 1440,
  },
  { id: "MULE", label: "Mule", manufacturer: "Drake", capacity: 1 },
  { id: "VULTURE", label: "Vulture", manufacturer: "Drake", capacity: 13 },
  {
    id: "PROWLER_UTILITY",
    label: "Prowler Utility",
    manufacturer: "Esperia",
    capacity: 32,
  },
  {
    id: "RAILEN_CONCEPT",
    label: "Railen [Concept]",
    manufacturer: "Gatac",
    capacity: 640,
  },
  { id: "SYULEN", label: "Syulen", manufacturer: "Gatac", capacity: 6 },
  { id: "SHIV", label: "Shiv", manufacturer: "Grey's", capacity: 32 },
  { id: "FORTUNE", label: "Fortune", manufacturer: "MISC", capacity: 16 },
  { id: "FREELANCER", label: "Freelancer", manufacturer: "MISC", capacity: 66 },
  {
    id: "FREELANCER_DUR",
    label: "Freelancer DUR",
    manufacturer: "MISC",
    capacity: 36,
  },
  {
    id: "FREELANCER_MAX",
    label: "Freelancer MAX",
    manufacturer: "MISC",
    capacity: 120,
  },
  {
    id: "FREELANCER_MIS",
    label: "Freelancer MIS",
    manufacturer: "MISC",
    capacity: 36,
  },
  { id: "HULL_A", label: "Hull-A", manufacturer: "MISC", capacity: 64 },
  { id: "HULL_B", label: "Hull-B", manufacturer: "MISC", capacity: 512 },
  { id: "HULL_C", label: "Hull-C", manufacturer: "MISC", capacity: 4608 },
  {
    id: "HULL_D_CONCEPT",
    label: "Hull-D [Concept]",
    manufacturer: "MISC",
    capacity: 6912,
  },
  {
    id: "HULL_E_CONCEPT",
    label: "Hull-E [Concept]",
    manufacturer: "MISC",
    capacity: 12288,
  },
  {
    id: "RELIANT_KORE",
    label: "Reliant Kore",
    manufacturer: "MISC",
    capacity: 6,
  },
  {
    id: "RELIANT_TANA",
    label: "Reliant Tana",
    manufacturer: "MISC",
    capacity: 1,
  },
  { id: "STARFARER", label: "Starfarer", manufacturer: "MISC", capacity: 291 },
  {
    id: "STARFARER_GEMINI",
    label: "Starfarer Gemini",
    manufacturer: "MISC",
    capacity: 291,
  },
  {
    id: "STARLANCER_MAX",
    label: "Starlancer MAX",
    manufacturer: "MISC",
    capacity: 224,
  },
  {
    id: "STARLANCER_TAC",
    label: "Starlancer TAC",
    manufacturer: "MISC",
    capacity: 96,
  },
  { id: "100I", label: "100i", manufacturer: "Origin", capacity: 2 },
  { id: "125A", label: "125a", manufacturer: "Origin", capacity: 2 },
  { id: "135C", label: "135c", manufacturer: "Origin", capacity: 6 },
  { id: "300I", label: "300i", manufacturer: "Origin", capacity: 8 },
  { id: "315P", label: "315p", manufacturer: "Origin", capacity: 12 },
  { id: "325A", label: "325a", manufacturer: "Origin", capacity: 4 },
  { id: "350R", label: "350r", manufacturer: "Origin", capacity: 4 },
  { id: "400I", label: "400i", manufacturer: "Origin", capacity: 42 },
  {
    id: "600I_EXPLORER",
    label: "600i Explorer",
    manufacturer: "Origin",
    capacity: 44,
  },
  {
    id: "600I_TOURING",
    label: "600i Touring",
    manufacturer: "Origin",
    capacity: 20,
  },
  { id: "890_JUMP", label: "890 Jump", manufacturer: "Origin", capacity: 388 },
  { id: "M80", label: "M80", manufacturer: "Origin", capacity: 2 },
  {
    id: "APOLLO_MEDIVAC",
    label: "Apollo Medivac",
    manufacturer: "RSI",
    capacity: 32,
  },
  {
    id: "APOLLO_TRIAGE",
    label: "Apollo Triage",
    manufacturer: "RSI",
    capacity: 32,
  },
  {
    id: "ARRASTRA_CONCEPT",
    label: "Arrastra [Concept]",
    manufacturer: "RSI",
    capacity: 576,
  },
  {
    id: "AURORA_MK_II",
    label: "Aurora (Mk II)",
    manufacturer: "RSI",
    capacity: 2,
  },
  {
    id: "AURORA_MK_II_CARGO",
    label: "Aurora (Mk II) [Cargo]",
    manufacturer: "RSI",
    capacity: 8,
  },
  {
    id: "AURORA_CL_MK_I",
    label: "Aurora CL (Mk I)",
    manufacturer: "RSI",
    capacity: 6,
  },
  {
    id: "AURORA_ES_MK_I",
    label: "Aurora ES (Mk I)",
    manufacturer: "RSI",
    capacity: 3,
  },
  {
    id: "AURORA_LN_MK_I",
    label: "Aurora LN (Mk I)",
    manufacturer: "RSI",
    capacity: 3,
  },
  {
    id: "AURORA_LX_MK_I",
    label: "Aurora LX (Mk I)",
    manufacturer: "RSI",
    capacity: 3,
  },
  {
    id: "AURORA_MR_MK_I",
    label: "Aurora MR (Mk I)",
    manufacturer: "RSI",
    capacity: 3,
  },
  {
    id: "CONSTELLATION_ANDROMEDA",
    label: "Constellation Andromeda",
    manufacturer: "RSI",
    capacity: 96,
  },
  {
    id: "CONSTELLATION_AQUILA",
    label: "Constellation Aquila",
    manufacturer: "RSI",
    capacity: 96,
  },
  {
    id: "CONSTELLATION_PHOENIX",
    label: "Constellation Phoenix",
    manufacturer: "RSI",
    capacity: 80,
  },
  {
    id: "CONSTELLATION_TAURUS",
    label: "Constellation Taurus",
    manufacturer: "RSI",
    capacity: 174,
  },
  {
    id: "GALAXY_BASE_CONCEPT",
    label: "Galaxy [Base Concept]",
    manufacturer: "RSI",
    capacity: 64,
  },
  {
    id: "GALAXY_CARGO_CONCEPT",
    label: "Galaxy [Cargo Concept]",
    manufacturer: "RSI",
    capacity: 576,
  },
  { id: "HERMES", label: "Hermes", manufacturer: "RSI", capacity: 288 },
  { id: "PERSEUS", label: "Perseus", manufacturer: "RSI", capacity: 96 },
  { id: "POLARIS", label: "Polaris", manufacturer: "RSI", capacity: 576 },
  { id: "SALVATION", label: "Salvation", manufacturer: "RSI", capacity: 6 },
  {
    id: "ZEUS_MK_II_CL",
    label: "Zeus Mk II CL",
    manufacturer: "RSI",
    capacity: 128,
  },
  {
    id: "ZEUS_MK_II_ES",
    label: "Zeus Mk II ES",
    manufacturer: "RSI",
    capacity: 32,
  },
  {
    id: "ZEUS_MK_II_MR_CONCEPT",
    label: "Zeus Mk II MR [Concept]",
    manufacturer: "RSI",
    capacity: 16,
  },
  { id: "CYCLONE", label: "Cyclone", manufacturer: "Tumbril", capacity: 1 },
]

export type ShipId = (typeof SHIPS)[number]["id"]

export interface StopItem {
  missionIndex: number
  cargoType?: string
  scu?: number
  optional?: boolean
}

export type StopType = "PICKUP" | "DROPOFF" | "PICKUP_DROPOFF"

export interface Stop {
  location: string
  parentBody?: string
  stopType: StopType
  distanceAu?: number
  distanceLabel?: string
  pickups: StopItem[]
  dropoffs: StopItem[]
}

export interface OptimizeResult {
  selectedMissionIndices: number[]
  stops: Stop[]
  stopCount: number
  totalRewardUec: number
  totalXp: number
}

export const MISSION_COLORS = [
  "var(--m1)",
  "var(--m2)",
  "var(--m3)",
  "var(--m4)",
  "var(--m5)",
  "var(--m6)",
  "var(--m7)",
]

export const MISSION_COLORS_SOFT = [
  "var(--m1-soft)",
  "var(--m2-soft)",
  "var(--m3-soft)",
  "var(--m4-soft)",
  "var(--m5-soft)",
  "var(--m6-soft)",
  "var(--m7-soft)",
]
