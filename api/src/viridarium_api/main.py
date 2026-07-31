import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app):
    logger.info("Starting up...")
    yield
    logger.info("Shutting down...")


app = FastAPI(title="Viridarium API", version="0.1.0", lifespan=lifespan)


@app.get("/")
async def root():
    return {"message": "Welcome to the Viridarium API!"}
