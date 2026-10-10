# Agent Instructions - Viridarium

## Repository Context

- Project name is `viridarium`.
- Architecture is incrementally built service-by-service.
- Current active service is FastAPI backend API in `api/`.
- Current developer startup path for backend (from repo root) is:

```bash
uv sync
uv run fastapi dev --port 8700
```

- Optional containerized startup path for backend is:

```bash
docker compose --profile optional up --build api
```

## Documentation Requirements

- Always update `docs/architecture.md` when adding, removing, or changing a service, interface, or major workflow.
- Always update `docs/development.md` when local setup steps or service run commands change.
- Keep architecture and development documents aligned with actual code and current service status.
- If a feature is planned but not implemented, mark it as planned.

## Markdown Rules

- Keep every Markdown file in this repository at **160 lines or fewer**, excluding table width concerns.
- Use Mermaid for all diagrams created in Markdown files.
- Prefer concise sections with actionable content over long narrative text.

## Authoring Style

- Use consistent naming: `Viridarium` for product, service names in lowercase code style.
- Separate current behavior from planned behavior.
- Include runnable commands for local development where relevant.
