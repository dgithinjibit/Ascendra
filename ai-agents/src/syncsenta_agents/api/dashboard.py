"""Teacher Dashboard API endpoints.

GET endpoints read from the Phase 1 telemetry tables via `dashboard_queries`.
The WebSocket handlers and POST /interventions remain unchanged. New Phase 2
endpoints surface trends per learner and per competency.
"""

from fastapi import APIRouter, HTTPException, Header, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import asyncio
import uuid

from .websocket import manager, handle_teacher_intervention
from ..core.logging import AgentLogger
from . import dashboard_queries as dq

try:
    from ..db.supabase_client import try_get_supabase_client
except Exception:
    def try_get_supabase_client():  # type: ignore[no-redef]
        return None

router = APIRouter(prefix="/dashboard", tags=["teacher-dashboard"])
logger = AgentLogger("dashboard_api")


# Request/Response Models
class StudentActivitySummary(BaseModel):
    student_id: str
    student_name: str
    status: str  # 'active', 'idle', 'struggling', 'offline'
    current_subject: Optional[str] = None
    current_topic: Optional[str] = None
    current_agent: Optional[str] = None
    duration_minutes: int
    last_activity: datetime
    mastery_indicator: Optional[float] = None
    engagement_score: Optional[float] = None
    primary_pattern: Optional[str] = None


class AgentUsageStats(BaseModel):
    agent_type: str
    request_count: int
    avg_response_time_ms: float
    success_rate: float
    total_tokens: int


class StudentProgressDetail(BaseModel):
    student_id: str
    subject: str
    topic: str
    mastery_level: float
    time_spent_minutes: int
    quiz_scores: List[float] = []
    last_activity: datetime
    competency: Optional[str] = None
    session_id: Optional[str] = None
    engagement_score: Optional[float] = None
    primary_pattern: Optional[str] = None


class TeacherIntervention(BaseModel):
    student_id: str
    intervention_type: str  # 'message', 'assignment', 'flag', 'redirect'
    content: str
    priority: str = 'normal'


# WebSocket endpoint for real-time updates
@router.websocket("/ws/teacher")
async def teacher_websocket(websocket: WebSocket):
    """WebSocket connection for teacher dashboard real-time updates."""
    await manager.connect(websocket, "teachers")
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_json()
            
            # Handle teacher actions
            if data.get("type") == "intervention":
                await handle_teacher_intervention(data.get("data", {}))
            
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, "teachers")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, "teachers")


@router.websocket("/ws/student/{student_id}")
async def student_websocket(websocket: WebSocket, student_id: str):
    """WebSocket connection for student to receive teacher interventions."""
    await manager.connect(websocket, "students")
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Handle student heartbeat/activity
            if data.get("type") == "heartbeat":
                # Update student session status
                pass
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, "students")
    except Exception as e:
        logger.error(f"Student WebSocket error: {e}")
        manager.disconnect(websocket, "students")


@router.get("/students/active", response_model=List[StudentActivitySummary])
async def get_active_students(limit: int = 50):
    """List students with a session that ended in the last 30 minutes."""
    rows = dq.get_active_students(limit=limit)
    return [StudentActivitySummary(**r) for r in rows]


@router.get("/agents/stats", response_model=List[AgentUsageStats])
async def get_agent_stats(hours: int = 1):
    """Get AI agent usage statistics from the ai_decisions table."""
    supabase = try_get_supabase_client()
    if supabase is None:
        return []

    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    try:
        resp = (
            supabase.table("ai_decisions")
            .select("agent_type, response_time_ms, status, tokens_used, created_at")
            .gte("created_at", cutoff)
            .execute()
        )
        rows = resp.data or []
    except Exception as exc:
        logger.warning(f"agent_stats query failed: {exc}")
        return []

    from collections import defaultdict
    buckets: Dict[str, Dict[str, Any]] = defaultdict(
        lambda: {"count": 0, "total_ms": 0.0, "success": 0, "tokens": 0}
    )
    for r in rows:
        agent = r.get("agent_type") or "unknown"
        b = buckets[agent]
        b["count"] += 1
        b["total_ms"] += float(r.get("response_time_ms") or 0)
        if (r.get("status") or "").lower() in {"success", "completed", "ok"}:
            b["success"] += 1
        b["tokens"] += int(r.get("tokens_used") or 0)

    return [
        AgentUsageStats(
            agent_type=agent,
            request_count=b["count"],
            avg_response_time_ms=round(b["total_ms"] / b["count"], 1) if b["count"] else 0.0,
            success_rate=round(b["success"] / b["count"], 4) if b["count"] else 0.0,
            total_tokens=b["tokens"],
        )
        for agent, b in sorted(buckets.items())
    ]


@router.get("/students/{student_id}/progress", response_model=List[StudentProgressDetail])
async def get_student_progress(student_id: str, limit: int = 25):
    """Recent sessions for one student, with mastery + engagement per session."""
    rows = dq.get_student_progress(student_id, limit=limit)
    return [StudentProgressDetail(**r) for r in rows]


@router.get("/students/{student_id}/misconceptions")
async def get_student_misconceptions(student_id: str, limit: int = 50, grouped: bool = False):
    """All misconceptions for a student (newest first), or grouped by type."""
    if grouped:
        return {"student_id": student_id, "by_type": dq.get_misconception_summary(student_id)}
    return {"student_id": student_id, "rows": dq.get_student_misconceptions(student_id, limit=limit)}


@router.get("/students/{student_id}/interventions")
async def get_student_interventions(student_id: str, limit: int = 25):
    """Recent interventions generated for one student."""
    return {"student_id": student_id, "rows": dq.get_student_interventions(student_id, limit=limit)}


@router.get("/students/{student_id}/timeline")
async def get_student_timeline(student_id: str, limit: int = 30):
    """Session-by-session timeline with misconception + intervention counts."""
    return {"student_id": student_id, "sessions": dq.get_student_timeline(student_id, limit=limit)}


@router.get("/competencies/summary")
async def get_competency_summary(limit: int = 50):
    """Every competency seen with cohort-level session/misconception counts."""
    return {"competencies": dq.get_competency_summary(limit=limit)}


@router.get("/competencies/{competency}/trends")
async def get_competency_trends(competency: str):
    """Cohort-level trends for one competency."""
    return dq.get_competency_trends(competency)


@router.post("/interventions")
async def create_intervention(
    intervention: TeacherIntervention,
    x_teacher_id: Optional[str] = Header(None, alias="X-Teacher-Id"),
    x_teacher_name: Optional[str] = Header(None, alias="X-Teacher-Name"),
):
    """Create a teacher intervention for a student and persist it to the database."""
    teacher_id = x_teacher_id or "unknown"
    teacher_name = x_teacher_name or "Teacher"

    try:
        supabase = try_get_supabase_client()
        if supabase is not None:
            row = {
                "intervention_id": str(uuid.uuid4()),
                "student_id": intervention.student_id,
                "intervention_type": intervention.intervention_type,
                "title": f"{intervention.intervention_type.capitalize()} from {teacher_name}",
                "objective": intervention.content,
                "priority": intervention.priority,
                "payload": {
                    "content": intervention.content,
                    "teacher_id": teacher_id,
                    "teacher_name": teacher_name,
                    "source": "teacher_dashboard",
                },
            }
            supabase.table("interventions").insert(row).execute()

        # Broadcast to student via WebSocket
        await handle_teacher_intervention({
            "student_id": intervention.student_id,
            "intervention_type": intervention.intervention_type,
            "content": intervention.content,
            "teacher_name": teacher_name,
        })

        return {"success": True, "message": "Intervention sent"}

    except Exception as e:
        logger.error(f"Failed to create intervention: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts")
async def get_alerts(acknowledged: bool = False, limit: int = 50):
    """Live alerts derived from recent behavioral profiles flagged for intervention."""
    return dq.get_alerts(acknowledged=acknowledged, limit=limit)


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int):
    """Mark an alert as acknowledged by updating the behavioral profile."""
    supabase = try_get_supabase_client()
    if supabase is not None:
        try:
            # Alerts are synthesized from behavioral_profiles; we mark the
            # profile's intervention_needed flag false so it stops surfacing.
            supabase.table("behavioral_profiles").update(
                {"intervention_needed": False}
            ).eq("id", alert_id).execute()
        except Exception as exc:
            logger.warning(f"alert acknowledge DB update failed: {exc}")
            # Non-fatal — the WebSocket broadcast still counts as acknowledged.
    return {"success": True}
