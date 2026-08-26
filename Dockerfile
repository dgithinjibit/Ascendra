# ─────────────────────────────────────────────────────────────────────────────
# SyncSenta / Ascendra — AI Agents backend
#
# This image builds the Python "ai-agents" service, which is where the
# student ↔ teacher AI connector lives (the work under review):
#   - src/syncsenta_agents/api/server.py        (/agents/chat + teacher_id resolver)
#   - src/syncsenta_agents/orchestrator/workflow.py
#   - src/syncsenta_agents/agents/tutoring.py   (logs AI decisions for teachers)
#   - tests/test_teacher_connector.py           (end-to-end verification)
#
# ── Reproduce the verification (no network / no API keys needed) ─────────────
#   docker build -t ascendra-ai .
#   docker run --rm ascendra-ai                 # runs the connector test suite
#
# ── Run the backend API instead ──────────────────────────────────────────────
#   docker run --rm -p 8001:8001 \
#       -e GROQ_API_KEY=<key> \
#       -e SUPABASE_URL=<url> -e SUPABASE_SERVICE_KEY=<key> \
#       ascendra-ai serve
#   # API on http://localhost:8001  (health: GET /healthz)
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

# System deps kept minimal; slim base already has what the pure-Python deps need.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    # The tutoring agent / server import path expects the package on PYTHONPATH.
    PYTHONPATH=/app/src \
    # Offline-safe default so the test suite never needs a real key at import time.
    # Overridden at `docker run` time when serving for real.
    GROQ_API_KEY=test-key-offline

WORKDIR /app

# ── Dependencies (cached layer) ───────────────────────────────────────────────
# requirements.txt is the runtime dep set; pytest + pytest-asyncio are the dev
# deps needed to run the verification suite (they live in pyproject's dev group,
# not requirements.txt, so we add them explicitly).
COPY ai-agents/requirements.txt ./requirements.txt
RUN pip install --upgrade pip \
 && pip install -r requirements.txt \
 && pip install "pytest>=7.4.0" "pytest-asyncio>=0.21.0"

# ── Application source ────────────────────────────────────────────────────────
COPY ai-agents/ ./

# ── Entrypoint ────────────────────────────────────────────────────────────────
# Default: run the connector verification tests (the deliverable proof).
# `docker run ... serve` : launch the FastAPI backend on :8001 instead.
# `docker run ... test`  : explicit form of the default.
# Anything else is passed straight through (e.g. `pytest -k resolve`, `bash`).
COPY <<'EOF' /usr/local/bin/entrypoint.sh
#!/bin/sh
set -e
case "$1" in
  ""|test)
    exec pytest tests/test_teacher_connector.py -v
    ;;
  serve)
    exec uvicorn syncsenta_agents.api.server:app --host 0.0.0.0 --port 8001
    ;;
  *)
    exec "$@"
    ;;
esac
EOF
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8001
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
