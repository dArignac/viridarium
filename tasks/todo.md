# Task List: garden-inventory Module

Ordered implementation tasks for the garden-inventory module in `service/`.

- [x] Task 1: Inventory Schema & Migrations
  - Acceptance: Tables `sections`, `landmarks`, `plants`, `placements` defined with foreign keys and unique constraints; migrations generate cleanly.
  - Verify: `pnpm db:generate` and in-memory schema tests pass.
  - Files: `service/src/db/schema/inventory.ts`, `service/src/db/index.ts`, `service/tests/unit/inventory/schema.test.ts`

- [x] Task 2: Inventory Zod Schemas & Scoped Queries
  - Acceptance: Zod validation schemas for all entities; queries strictly filter by `userId` and fetch full grid state.
  - Verify: `pnpm test tests/unit/inventory/queries.test.ts`
  - Files: `service/src/lib/inventory/schemas.ts`, `service/src/lib/inventory/queries.ts`, `service/tests/unit/inventory/queries.test.ts`

- [x] Task 3: Inventory Server Actions
  - Acceptance: Server actions handle section CRUD, landmark CRUD, plant CRUD, and placement/removal with grid coordinate boundary checks (`0 <= x < width`).
  - Verify: `pnpm test tests/unit/inventory/actions.test.ts`
  - Files: `service/src/lib/inventory/actions.ts`, `service/tests/unit/inventory/actions.test.ts`

- [x] Task 4: Interactive 2D Grid Component
  - Acceptance: Responsive mobile touch grid renders coordinate cells, landmark shapes (rectangles, circles with labels), and plant markers; supports tap-to-select cell.
  - Verify: Component compiles with 0 errors in Next.js build.
  - Files: `service/src/components/inventory/section-grid.tsx`

- [x] Task 5: Botanical Plant Registry Page
  - Acceptance: `/inventory/plants` displays list of all user plants with watering intervals, pruning calendar badges, and creation modal.
  - Verify: `pnpm build` passes with zero errors.
  - Files: `service/app/(dashboard)/inventory/plants/page.tsx`, `service/app/(dashboard)/inventory/plants/plant-form-modal.tsx`

- [x] Task 6: Section Grid Viewer & Placement Page
  - Acceptance: `/inventory` provides section switcher, landmark addition, cell selection drawer, and plant placement flow; navigation linked from home cockpit.
  - Verify: `pnpm build` and `pnpm lint` pass with zero errors.
  - Files: `service/app/(dashboard)/inventory/page.tsx`, `service/app/(dashboard)/inventory/section-manager.tsx`, `service/app/page.tsx`

- [x] Task 7: Playwright Mobile E2E Test Suite for Inventory
  - Acceptance: Mobile browser test verifies: section creation $\rightarrow$ landmark creation $\rightarrow$ plant creation $\rightarrow$ grid placement $\rightarrow$ tenant isolation.
  - Verify: `pnpm test:e2e tests/e2e/inventory.spec.ts` passes green on mobile viewport.
  - Files: `service/tests/e2e/inventory.spec.ts`
