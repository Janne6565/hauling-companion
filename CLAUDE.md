# Hauling Companion — Claude Code Instructions

## Before committing and tagging

Always run these two checks before creating a commit or tag:

```bash
npm run lint
npm run build
```

If lint fails, check whether the errors are pre-existing (see known baseline below) or introduced by your changes. Fix any errors you introduced before committing. Build must always pass.

## Known pre-existing lint errors (baseline — do not fix without separate task)

- `src/components/ui/button.tsx` — `react-refresh/only-export-components`
- `src/pages/import/index.tsx` — `react-hooks/purity` (Math.random in useMemo)
- `src/pages/plan/index.tsx` — unused vars `_bullet`, `_missionIndices`

## Tagging convention

Tags follow `vMAJOR.MINOR.PATCH`. After confirming lint + build pass, create and push together:

```bash
git tag vX.Y.Z
git push origin main --tags
```

## Project layout

- Frontend only: `src/` — React 19 + TypeScript + Vite + Tailwind CSS 4
- Phase-based routing via localStorage (`sch:phase`), no React Router
- Pages live in `src/pages/<phase-name>/index.tsx`
- Shared types in `src/types/index.ts` — update `Phase` union and `PHASES` array when adding a phase
