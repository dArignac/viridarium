FROM python:3.13-alpine

ENV UV_NO_DEV=1 UV_COMPILE_BYTECODE=1 LANG=C.UTF-8 LC_ALL=C.UTF-8 PYTHONUNBUFFERED=1

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /code

COPY pyproject.toml uv.lock ./

COPY api/pyproject.toml api/
COPY api/src api/src

RUN uv sync --frozen --package viridarium-api

ENV PATH="/code/.venv/bin:$PATH"

CMD ["fastapi", "run", "api/src/viridarium_api/main.py", "--port", "8700"]
