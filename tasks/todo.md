# Task List: identity Module

Ordered implementation tasks for the identity module in `service/`.

- [ ] Task 1: Setup Dependencies and Test Harness
  - Acceptance: Runtime and dev dependencies installed; Vitest and Playwright configured; in-memory SQLite test helper ready.
  - Verify: `pnpm test` executes without errors.
  - Files: `service/package.json`, `service/vitest.config.ts`, `service/tests/helpers/db.ts`

- [ ] Task 2: Define Auth Database Schema and Migrations
  - Acceptance: Drizzle schema defines `users` (with TOTP fields) and `sessions`; migrations generate cleanly.
  - Verify: `pnpm db:generate` succeeds and in-memory schema initializes in tests.
  - Files: `service/src/db/index.ts`, `service/src/db/schema/auth.ts`, `service/drizzle.config.ts`

- [ ] Task 3: Implement Password Hashing & Strength Validation
  - Acceptance: Zod schema enforces 12+ chars with uppercase, lowercase, number, and symbol; Argon2id hashing and verification work reliably.
  - Verify: `pnpm test tests/unit/password.test.ts`
  - Files: `service/src/lib/auth/password.ts`, `service/tests/unit/password.test.ts`

- [ ] Task 4: Implement TOTP 2FA and Session Handling
  - Acceptance: TOTP secrets and QR data URLs generated; token validation passes RFC 6238 checks; Jose encrypted session cookies support 30-day sliding refresh.
  - Verify: `pnpm test tests/unit/totp.test.ts` and `pnpm test tests/unit/session.test.ts`
  - Files: `service/src/lib/auth/totp.ts`, `service/src/lib/auth/session.ts`, `service/tests/unit/totp.test.ts`, `service/tests/unit/session.test.ts`

- [ ] Task 5: Implement Auth Guards & Tenant Isolation
  - Acceptance: `requireUser()` and `requireAdmin()` return authenticated caller context or redirect/throw; isolates user data queries.
  - Verify: `pnpm test tests/unit/guard.test.ts`
  - Files: `service/src/lib/auth/guard.ts`, `service/tests/unit/guard.test.ts`

- [ ] Task 6: Implement Auth Server Actions
  - Acceptance: Server actions handle setup (blocks when users exist), credentials login, 2FA challenge, 2FA enable/disable, and logout.
  - Verify: `pnpm test tests/unit/actions.test.ts`
  - Files: `service/src/lib/auth/actions.ts`, `service/tests/unit/actions.test.ts`

- [ ] Task 7: Build Mobile-Optimized Auth UI Pages
  - Acceptance: Responsive mobile UI for `/setup`, `/login`, `/login/2fa`, and `/settings/2fa` with password strength indicator and QR code display.
  - Verify: `pnpm build` completes with zero TypeScript or lint errors.
  - Files: `service/app/(auth)/setup/page.tsx`, `service/app/(auth)/login/page.tsx`, `service/app/(auth)/login/2fa/page.tsx`, `service/app/(dashboard)/settings/2fa/page.tsx`

- [ ] Task 8: Implement Playwright Mobile E2E Integration Suite
  - Acceptance: Headless mobile browser E2E test passes complete flow: setup $\rightarrow$ login $\rightarrow$ 2FA activation $\rightarrow$ 2FA login $\rightarrow$ session persistence.
  - Verify: `pnpm test:e2e` passes green.
  - Files: `service/playwright.config.ts`, `service/tests/e2e/auth.spec.ts`
