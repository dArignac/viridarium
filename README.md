# Viridarium

Viridarium is a self-hosted garden management platform maintained as a monorepo.

The project is being delivered incrementally. The first active service is a FastAPI backend API, and additional services will be added step by step.

## Current Status

- Active service: `viridarium-api` (FastAPI)
- Local runtime options:
  - uv workspace path from repository root
  - Docker Compose path using `docker-compose.yml` and `api/Dockerfile`
- Additional services are planned and documented in architecture notes

See `docs/development.md` for runnable local commands.

## Documentation

- [Architecture](./docs/architecture.md)
- [Development](./docs/development.md)
- [Copilot Instructions](./.github/copilot-instructions.md)
