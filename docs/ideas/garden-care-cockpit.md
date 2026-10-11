# Viridarium: Garden Care Cockpit

## Problem Statement
How might we give a self-hosting gardener an effortless daily care cockpit — combining a low-friction "Today" action queue with intuitive section-based 2D orientation grids — while keeping maintenance, telemetry, and setup close to zero?

## Recommended Direction
Build an **action-first care cockpit** backed by an **extensible immutable event engine**:
- **Landing Screen ("Today in the Garden"):** A consolidated daily action list grouped by zones and urgent safety locks. 1-tap completion for daily routines (e.g., "Water Raised Bed 1") with optional drill-down for exact volume or dosage.
- **Pesticide Safety Lockout Guard:** An active safety state that computes post-treatment waiting periods, displaying countdowns until safe harvest and until next permitted application.
- **Sectioned 2D Tile Maps:** Gardens are split into distinct sections (e.g., "Front Yard", "Veggie Patch", "Greenhouse"), each with its own manageable 2D grid. Grids support basic orientation shapes (rectangles, circles for sheds, paths, beds) and plant markers.
- **Immutable Event Stream:** All plant interactions are recorded as immutable `GardenEvent` records, allowing future features (fertilizing, pest monitoring, weather offsets) to be added without schema migrations.

## Key Assumptions to Validate
- [ ] Section-based grids (e.g., 10x10 to 20x20 per garden area) keep mobile touch navigation fluid without complex canvas panning.
- [ ] Zone-level batch watering covers >80% of daily routine watering while maintaining individual plant care intervals.
- [ ] Self-hosters have access to HTTPS or a local reverse proxy (Caddy/Traefik) for PWA Web Push notifications.

## MVP Scope

### In Scope
1. **Multi-User Isolation & Bootstrap Setup:**
   - Single-instance multi-user support with isolated data stores per user.
   - Initial bootstrap admin account created on setup to invite/manage users.
2. **Garden Sections & 2D Grid Layouts:**
   - Multiple sections per garden (e.g., "Front Yard", "South Raised Beds").
   - 2D grid viewer/editor with basic non-plant orientation landmarks (rectangles, circles, paths, taps).
   - Plant placement on grid tiles with custom care rules (watering interval, pruning season, pesticide waiting periods).
3. **"Today in the Garden" Action Feed:**
   - Prioritized daily task queue (watering overdue, pruning window open, safety lockout active).
   - 1-tap zone batch completion (e.g., mark all plants in Bed A as watered).
   - Optional drill-down to record water volume or pesticide dosage.
4. **Pesticide Safety Guard:**
   - Treatment logging (chemical/product name, date, safety waiting days).
   - Active lockout status on plant tiles and feed with remaining safe-harvest countdown.
5. **Shrub & Tree Pruning Reminders:**
   - Pruning schedules surfacing during active seasonal windows.
6. **Immutable Event Core:**
   - Centralized `GardenEvent(user_id, plant_id/zone_id, event_type, payload, timestamp)` architecture.
7. **Containerized Deployment:**
   - Unified `docker compose` configuration for FastAPI backend and Next.js frontend.

## Not Doing (and Why)
- **Automatic Weather Adjustments** — Keep MVP self-contained with zero external API dependencies. Can be layered onto the event engine later.
- **Living Heatmap Animations** — High frontend rendering overhead on mobile; static status badges on tiles are cleaner.
- **CAD/Freehand Canvas Drawing** — High maintenance and poor mobile gesture usability; discrete section grids with geometric landmarks are faster to use.
- **Plant Photo Uploads / Computer Vision** — Unnecessary storage and bandwidth overhead during quick garden chores.
- **Inter-User Garden Sharing** — Keep data models and permission logic strictly private and isolated per user for now.

## Open Questions & Next Steps
- For bootstrap admin creation, prefer environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) or a first-run web setup wizard?
- Define event projection logic for calculating plant hydration status based on event history.
