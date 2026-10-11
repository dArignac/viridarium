# Viridarium Development Guide

## Local Setup

The application is located in the `service/` directory.

### Prerequisites

- Node.js >= 20
- pnpm >= 9

### Installation & Run

```bash
# Navigate to service directory
cd service

# Install dependencies
pnpm install

# Install Playwright browser engines (for E2E tests)
pnpm exec playwright install --with-deps chromium

# Start development server with local HTTPS (for PWA testing)
pnpm dev
```

The application runs at `https://localhost:3000` (or `http://localhost:3000`).

### Build & Verification Commands

```bash
# Lint code
pnpm lint

# Run unit and server integration tests (Vitest)
pnpm test

# Run mobile browser integration & E2E tests (Playwright)
pnpm test:e2e

# Production build
pnpm build
```

### Database Operations (Drizzle / SQLite)

```bash
# Generate database migrations from schema changes
pnpm db:generate

# Apply migrations to local database
pnpm db:migrate
```
