# Spec: identity

## Objective
Establish instance bootstrap, user authentication, optional TOTP two-factor authentication (2FA), and multi-user tenant isolation for Viridarium.
- On first launch with 0 users in SQLite, redirect to `/setup` to create the initial Admin.
- Subsequent users are invited/created by the Admin; public registration is disabled.
- Enforce strong passwords (minimum 12 characters with character diversity rules).
- Provide optional TOTP 2FA (Google Authenticator, Bitwarden) with backup recovery codes.
- Issue encrypted HTTP-only session cookies with a 30-day sliding window refreshed on active use.
- Provide `requireUser()` / `requireAdmin()` server helpers enforcing strict user data isolation.

## Tech Stack
- Runtime & Framework: Next.js 16 (App Router, Node.js runtime), React 19, TypeScript
- Database & ORM: SQLite via `@libsql/client`, `drizzle-orm`, `drizzle-kit`
- Auth & Crypto: `@node-rs/argon2` (passwords), `jose` (session tokens), `otplib` & `qrcode` (TOTP 2FA)
- Validation & Testing: `zod`, `vitest` (server integration/unit), `@playwright/test` (browser integration/E2E)

## Commands
```bash
# In service/ directory:
Dev server:           pnpm dev
Typecheck & Build:    pnpm build
Unit & Server tests:  pnpm test
Browser E2E tests:    pnpm test:e2e
Lint codebase:        pnpm lint
Generate schema:      pnpm db:generate
Run migrations:       pnpm db:migrate
```

## Project Structure
```
service/
├── app/
│   ├── (auth)/setup/page.tsx          → First-run admin creation wizard
│   ├── (auth)/login/page.tsx          → User login (email + password)
│   ├── (auth)/login/2fa/page.tsx      → TOTP verification challenge
│   └── (dashboard)/settings/2fa/      → Setup/disable TOTP authenticator
├── src/
│   ├── db/
│   │   ├── index.ts                   → SQLite connection singleton
│   │   └── schema/auth.ts             → Users, sessions, and 2FA credentials
│   └── lib/auth/
│       ├── password.ts                → Argon2id hash & strength validation
│       ├── session.ts                 → Jose session seal, unseal & sliding refresh
│       ├── totp.ts                    → TOTP secret generation, QR code & verification
│       └── guard.ts                   → requireUser() & requireAdmin() helpers
├── tests/
│   ├── unit/auth/                     → Vitest in-memory SQLite server tests
│   └── e2e/auth/                      → Playwright mobile browser integration flows
└── playwright.config.ts               → Playwright configuration with webServer
```

## Code Style
```typescript
import { z } from "zod";

export const StrongPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Must include at least one uppercase letter")
  .regex(/[a-z]/, "Must include at least one lowercase letter")
  .regex(/[0-9]/, "Must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Must include at least one symbol");

export const CreateUserSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: StrongPasswordSchema,
  displayName: z.string().min(1).max(50),
});
```

## Testing Strategy
- **Tier 1 (Vitest):** Server integration and unit tests against in-memory SQLite (`:memory:`). Validates password hashing, TOTP tokens, session encryption, and `requireUser()` isolation in milliseconds.
- **Tier 2 (Playwright):** Full-stack browser integration tests against Next.js test server with temporary test database. Emulates mobile viewport (iPhone 14 / Pixel 7). Validates first-run redirect, admin creation, login, 2FA challenge, cookie setting, and 403 blocks.

## Boundaries
- **Always:** Use Argon2id for password hashing; enforce 12+ character complex passwords; encrypt TOTP secrets at rest; use HTTP-only SameSite=Lax Secure cookies; refresh active sessions on a 30-day rolling window; run Vitest before commits.
- **Ask first:** Adding WebAuthn / hardware security keys or external OIDC providers.
- **Never:** Store plaintext passwords; store unencrypted TOTP secrets; bypass 2FA check when enabled; permit public registration.

## Success Criteria
- [ ] Navigating to `/` when database has 0 users redirects to `/setup`.
- [ ] Password validation rejects passwords shorter than 12 characters or lacking character diversity.
- [ ] Setup creates Admin account with hashed credentials and automatically signs them in.
- [ ] Users can navigate to `/settings/2fa` to scan a QR code and enable TOTP.
- [ ] When 2FA is enabled, login requires valid email/password followed by valid 6-digit TOTP code.
- [ ] Authenticated requests within the 30-day window slide the cookie expiration forward by 30 days.
- [ ] `requireUser()` guarantees all down-stream actions access only the caller's tenant data.
- [ ] `pnpm test` (Vitest) passes with $>90\%$ coverage across the auth module.
- [ ] `pnpm test:e2e` (Playwright) passes the full setup $\rightarrow$ login $\rightarrow$ 2FA mobile flow.

## Open Questions
- None. (Two-tier testing strategy, 2FA, password strength, and sliding sessions are resolved).
