# Spec: garden-inventory

## Objective
Provide spatial and botanical inventory management for Viridarium.
- Users organize their garden into discrete sections (e.g., "Front Yard", "Veggie Patch", "Orchard").
- Each section has an abstracted 2D integer grid (e.g. 12x12).
- Users place non-plant landmarks (rectangles, circles for sheds, paths, beds, taps) for visual orientation.
- Users create plants with custom care rules (watering interval in days, seasonal pruning months 1-12, pesticide safety days).
- Plants are placed on grid coordinates `(section_id, x, y)`.
- All inventory data is strictly isolated per `user_id`.

## Tech Stack
- Framework & Runtime: Next.js 16 (App Router), React 19, TypeScript
- Database & ORM: SQLite via `@libsql/client`, `drizzle-orm`, `drizzle-kit`
- Validation & State: `zod`
- Testing: `vitest` (unit & server queries), `@playwright/test` (mobile grid touch interaction)

## Commands
```bash
# In service/ directory:
Dev server:           pnpm dev
Typecheck & Build:    pnpm build
Unit & Server tests:  pnpm test tests/unit/inventory/
Browser E2E tests:    pnpm test:e2e tests/e2e/inventory.spec.ts
Generate migrations:  pnpm db:generate
Run migrations:       pnpm db:migrate
```

## Project Structure
```
service/
├── app/(dashboard)/
│   ├── inventory/page.tsx             → Section switcher & 2D grid viewer
│   └── inventory/plants/page.tsx      → Botanical plant list & care editor
├── src/
│   ├── db/schema/inventory.ts         → Sections, landmarks, plants, placements tables
│   ├── lib/inventory/
│   │   ├── schemas.ts                 → Zod schemas for sections, plants, landmarks
│   │   ├── actions.ts                 → Server actions (CRUD sections, plants, placements)
│   │   └── queries.ts                 → Scoped database queries by user_id
│   └── components/inventory/
│       ├── section-grid.tsx           → Mobile touch 2D tile canvas/grid
│       └── plant-modal.tsx            → Plant creation & placement dialog
└── tests/
    ├── unit/inventory/                → Vitest tests for inventory queries & actions
    └── e2e/inventory.spec.ts          → Playwright mobile grid placement E2E
```

## Code Style
```typescript
import { z } from "zod";

export const CreatePlantSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.string().max(100).optional(),
  category: z.enum(["vegetable", "herb", "fruit_tree", "shrub", "flower", "other"]),
  waterIntervalDays: z.number().int().min(1).max(365),
  pruningMonths: z.array(z.number().int().min(1).max(12)).default([]),
  defaultPesticideWaitingDays: z.number().int().min(0).max(90).default(7),
  notes: z.string().max(500).optional(),
});
```

## Testing Strategy
- **Tier 1 (Vitest):** In-memory SQLite testing of section creation, landmark bounding collisions, plant care validation, coordinate placement uniqueness, and strict `user_id` query segregation.
- **Tier 2 (Playwright):** Mobile viewport testing of section switching, tapping a grid cell to place a plant, moving a plant, and landmark rendering.

## Boundaries
- **Always:** Require user authentication via `requireUser()`; scope every SQL query with `eq(table.userId, user.userId)`.
- **Ask first:** Allowing overlapping plants on the same coordinate cell.
- **Never:** Expose or mutate another user's sections or plants; allow negative coordinates or placements beyond section grid dimensions.

## Success Criteria
- [ ] Users can create, rename, and delete garden sections with custom dimensions (e.g. 10x10 to 30x30).
- [ ] Users can add landmarks (rectangles, circles, paths, taps) with labels for orientation.
- [ ] Users can register plants with custom watering intervals and pruning calendar months.
- [ ] Users can place and remove plants at specific grid coordinates `(section_id, x, y)`.
- [ ] Attempting to access another user's section returns a 404 or throws `ForbiddenError`.
- [ ] Mobile 2D grid allows smooth panning and responsive cell selection on small screens.
- [ ] `pnpm test` and `pnpm test:e2e` pass green with zero TypeScript or lint errors.

## Open Questions
- Can a plant exist in the inventory without being placed on a grid (unplaced seedlings/pots)? (Assumed: Yes, placement is optional).
