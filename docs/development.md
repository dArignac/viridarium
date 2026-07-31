# Development

## Goal

Run Viridarium locally for development. Current scope is the FastAPI backend service in `api/`.

## Prerequisites

- Python 3.13+
- `uv` installed
- Docker and Docker Compose (optional containerized path)

## Run API With uv Workspace

From the repository root, sync the workspace and start the API.

```bash
uv sync
cd api
uv run fastapi dev --port 8700
```

The API starts on `http://127.0.0.1:8700` by default.

## Run API With Docker Compose

From the repository root, build and start the `api` service defined in `docker-compose.yml`.

```bash
docker compose --profile optional up --build api
```

Stop the containerized stack:

```bash
docker compose --profile optional down
```

## Verify Service

In a second terminal:

```bash
curl http://127.0.0.1:8700/
```

Expected response:

```json
{"message":"Welcome to the Viridarium API!"}
```

## Notes

- The compose setup uses `api/Dockerfile` and loads runtime variables from `api/.env`.
- This repository will gain additional services over time.
- When a new service is introduced, add its local run commands to this page.
