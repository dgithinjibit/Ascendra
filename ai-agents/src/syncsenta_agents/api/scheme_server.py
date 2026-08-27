"""Lightweight local API for the teacher Scheme of Work generator.

This intentionally mounts only the Lesson Architect routes. It keeps the
teacher demo usable when optional student-chat orchestration dependencies are
not available on the local machine.
"""

from __future__ import annotations

import os
from typing import Any, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .lesson_architect_api import router as lesson_architect_router


app = FastAPI(title="syncsenta Scheme API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(lesson_architect_router)


@app.get("/healthz")
async def healthz() -> Dict[str, Any]:
    return {"status": "ok", "service": "scheme-generator", "provider": "nvidia"}
