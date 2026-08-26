"""Tutoring Agent — handles subject-specific student questions and explanations.

Uses the same swappable LLMProvider abstraction as AssessmentAgent so it can
run with Ollama in dev/prod and a deterministic stub in offline demo mode.

NOW ENHANCED with neuro-symbolic reasoning for explainable, adaptive tutoring.
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Protocol
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from ..core.exceptions import AgentError
from ..core.logging import AgentLogger
from ..reasoning.pedagogical_rules import PedagogicalRuleEngine, ScaffoldingLevel
from ..reasoning.knowledge_tracer import NeuralSymbolicKnowledgeTracer
from ..reasoning.misconception_detector import MisconceptionDetector
from ..reasoning.few_shot_examples import get_few_shot_loader
from ..db.decision_logger import get_decision_logger


class LLMProvider(Protocol):
    async def generate(self, prompt: str, *, system: str | None = None) -> str: ...


class _OllamaProvider:
    def __init__(self) -> None:
        import os
        
        # Hardcoded to use Groq (free, no local GPU needed)
        from langchain_groq import ChatGroq
        self._llm = ChatGroq(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.4,
        )
        self._use_groq = True

    async def generate(self, prompt: str, *, system: str | None = None) -> str:
        import asyncio

        if self._use_groq:
            # Groq uses messages format
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            response = await asyncio.to_thread(self._llm.invoke, messages)
            return response.content if hasattr(response, 'content') else str(response)
        else:
            # Ollama uses simple string
            full = f"[SYSTEM]\n{system}\n\n[USER]\n{prompt}" if system else prompt
            return await asyncio.to_thread(self._llm.invoke, full)


_SYSTEM_PROMPT = (
    "You are SyncSenta's Tutoring Agent for Kenyan CBC students. "
    "Explain concepts clearly at the student's grade level using local context "
    "(Kenyan names, shillings, ugali, matatu, etc.). Be warm, concise, and "
    "Socratic — when a student is stuck, lead them to the answer with one "
    "guiding question rather than dumping the full solution. "
    "Respect the subject the student opened: if they ask about a topic that "
    "belongs to a different CBC learning area (e.g. arithmetic inside Creative "
    "Activities, or drawing inside Mathematics), name the correct area in one "
    "short clause and either reframe their topic inside the current subject or "
    "propose an in-scope alternative — never silently switch subjects. "
    "Plain prose only, no markdown fences, no JSON."
)


class TutoringAgent:
    """Subject-specific tutoring with neuro-symbolic reasoning.
    
    Combines LLM generation with symbolic pedagogical rules for:
    - Explainable tutoring decisions
    - Adaptive scaffolding based on student state
    - Misconception detection and targeted remediation
    """

    def __init__(self, llm_provider: Optional[LLMProvider] = None, supabase_client=None) -> None:
        self.logger = AgentLogger("tutoring_agent")
        self._llm = llm_provider
        
        # Initialize neuro-symbolic reasoning components
        self.rule_engine = PedagogicalRuleEngine()
        self.knowledge_tracer = NeuralSymbolicKnowledgeTracer()
        self.misconception_detector = MisconceptionDetector()
        
        # Initialize few-shot example loader
        self.few_shot_loader = get_few_shot_loader()
        
        # Initialize decision logger for teacher feedback loop
        self.decision_logger = get_decision_logger(supabase_client)

    def _provider(self) -> LLMProvider:
        if self._llm is None:
            import os

            if (os.environ.get("SYNCSENTA_OFFLINE_DEMO") == "1"
                    or not os.getenv("GROQ_API_KEY")
                    or os.getenv("GROQ_API_KEY") == "test-key-offline"):
                from ..api.demo_stub import DemoStubLLM

                self._llm = DemoStubLLM()
            else:
                self._llm = _OllamaProvider()
        return self._llm

    async def execute_task(self, request: str, context: Dict[str, Any]) -> Dict[str, Any]:
        try:
            grade = (context or {}).get("grade") or "Grade 4"
            subject = (context or {}).get("subject") or "general"
            language = (context or {}).get("language", "english")
            student_id = (context or {}).get("student_id", "unknown")
            
            # Extract telemetry and interaction history if available
            telemetry = (context or {}).get("telemetry", {})
            interaction_history = (context or {}).get("interaction_history", [])
            competency = (context or {}).get("competency", f"{subject.upper()}.GENERAL")
            
            # STEP 1: Evaluate pedagogical rules
            rule_decision = self.rule_engine.evaluate(telemetry)
            
            self.logger.info(
                "Pedagogical rules evaluated",
                fired_rules=[r.rule_id for r in rule_decision.fired_rules],
                recommended_action=rule_decision.recommended_action,
                confidence=rule_decision.confidence
            )
            
            # STEP 2: Estimate mastery (if we have history)
            mastery_estimate = None
            if interaction_history:
                mastery_estimate = self.knowledge_tracer.estimate_mastery(
                    student_id=student_id,
                    competency=competency,
                    interaction_history=interaction_history,
                    telemetry=telemetry
                )
                
                self.logger.info(
                    "Mastery estimated",
                    score=mastery_estimate.mastery_score,
                    confidence=mastery_estimate.confidence
                )
            
            # STEP 3: Detect misconceptions
            misconceptions = self.misconception_detector.detect(
                competency=competency,
                interaction_history=interaction_history,
                telemetry=telemetry
            )
            
            if misconceptions:
                self.logger.info(
                    "Misconceptions detected",
                    count=len(misconceptions),
                    types=[m.misconception_type for m in misconceptions]
                )
            
            # STEP 4: Build context-aware prompt with neuro-symbolic insights + few-shot examples
            prompt = self._build_enhanced_prompt(
                request=request,
                grade=grade,
                subject=subject,
                language=language,
                region=(context or {}).get("region", "universal"),
                competency=competency,
                rule_decision=rule_decision,
                mastery_estimate=mastery_estimate,
                misconceptions=misconceptions,
                telemetry=telemetry
            )
            
            # STEP 5: Generate response with LLM. If a stale or revoked
            # credential is loaded, degrade to the deterministic local stub;
            # unrelated provider errors still surface to the caller.
            try:
                answer = await self._provider().generate(prompt, system=_SYSTEM_PROMPT)
            except Exception as provider_error:
                provider_text = str(provider_error).lower()
                if any(marker in provider_text for marker in ("invalid_api_key", "api key", "forbidden", "401", "403")):
                    from ..api.demo_stub import DemoStubLLM
                    answer = await DemoStubLLM().generate(prompt, system=_SYSTEM_PROMPT)
                else:
                    raise
            
            # STEP 6: Log decision for teacher feedback (self-learning loop)
            decision_id = await self.decision_logger.log_decision(
                decision_type="tutoring_response",
                student_id=student_id,
                teacher_id=(context or {}).get("teacher_id", "unknown"),
                competency=competency,
                grade=grade,
                subject=subject,
                ai_action=rule_decision.recommended_action,
                ai_response=(answer or "").strip(),
                context={
                    "session_id": (context or {}).get("session_id"),
                    "telemetry": telemetry,
                    "interaction_history": interaction_history,
                    "fired_rules": [
                        {
                            "rule_id": r.rule_id,
                            "name": r.name,
                            "explanation": r.explanation,
                            "confidence": r.confidence
                        }
                        for r in rule_decision.fired_rules
                    ],
                    "scaffolding_level": rule_decision.scaffolding_level.value,
                    "explanation": rule_decision.explanation,
                    "examples_used": self._extract_examples(answer or ""),
                    "language": language,
                    "region": (context or {}).get("region")
                }
            )
            
            # STEP 7: Return response with explainability metadata
            return {
                "agent": "tutoring",
                "response": (answer or "").strip(),
                "subject": subject,
                "grade": grade,
                "decision_id": decision_id,  # For tracking feedback
                # Explainability metadata
                "fired_rules": [
                    {
                        "rule_id": r.rule_id,
                        "name": r.name,
                        "explanation": r.explanation,
                        "confidence": r.confidence
                    }
                    for r in rule_decision.fired_rules
                ],
                "recommended_action": rule_decision.recommended_action,
                "scaffolding_level": rule_decision.scaffolding_level.value,
                "mastery_score": mastery_estimate.mastery_score if mastery_estimate else None,
                "mastery_confidence": mastery_estimate.confidence if mastery_estimate else None,
                "detected_misconceptions": [
                    {
                        "type": m.misconception_type,
                        "description": m.description,
                        "confidence": m.confidence,
                        "remediation": m.remediation_strategy
                    }
                    for m in misconceptions
                ],
                "explanation": rule_decision.explanation
            }
        except AgentError:
            raise
        except Exception as exc:  # noqa: BLE001
            self.logger.error("Tutoring task failed", error=str(exc))
            raise AgentError(f"Tutoring failure: {exc}") from exc
    
    def _build_enhanced_prompt(
        self,
        request: str,
        grade: str,
        subject: str,
        language: str,
        region: str,
        competency: str,
        rule_decision: Any,
        mastery_estimate: Any,
        misconceptions: list,
        telemetry: Dict[str, Any]
    ) -> str:
        """Build prompt enhanced with neuro-symbolic insights and few-shot examples."""
        
        prompt_parts = []
        
        # STEP 1: Add few-shot examples from dataset (culturally relevant)
        few_shot_examples = self.few_shot_loader.get_examples(
            grade=grade,
            region=region,
            competency=competency,
            num_examples=2,  # 2-3 examples work best for context window
            prefer_region=True
        )
        
        if few_shot_examples:
            examples_text = self.few_shot_loader.format_for_prompt(few_shot_examples)
            prompt_parts.append(examples_text)
            
            self.logger.info(
                "Few-shot examples loaded",
                count=len(few_shot_examples),
                grade=grade,
                region=region
            )
        
        # STEP 2: Add student context
        prompt_parts.extend([
            f"Student grade: {grade}",
            f"Subject: {subject}",
            f"Region: {region}",
            f"Preferred language: {language}",
            f"\nStudent question: {request}\n"
        ])
        
        # STEP 3: Add pedagogical context
        if rule_decision.fired_rules:
            prompt_parts.append(
                f"\nPedagogical Context:\n"
                f"- Detected student state: {rule_decision.explanation}\n"
                f"- Recommended approach: {rule_decision.recommended_action}\n"
                f"- Scaffolding level: {rule_decision.scaffolding_level.value}"
            )
        
        # STEP 4: Add mastery context
        if mastery_estimate:
            mastery_level = (
                "strong" if mastery_estimate.mastery_score > 0.7
                else "developing" if mastery_estimate.mastery_score > 0.4
                else "emerging"
            )
            prompt_parts.append(
                f"- Current mastery: {mastery_level} "
                f"({mastery_estimate.mastery_score:.2f})"
            )
        
        # STEP 5: Add misconception context
        if misconceptions:
            prompt_parts.append("\nDetected Misconceptions:")
            for m in misconceptions:
                prompt_parts.append(
                    f"- {m.description} (confidence: {m.confidence:.2f})\n"
                    f"  Remediation: {m.remediation_strategy}"
                )
        
        # STEP 6: Add telemetry insights
        if telemetry:
            prompt_parts.append("\nStudent Behavior Signals:")
            if "erasure_count" in telemetry:
                prompt_parts.append(f"- Erasures: {telemetry['erasure_count']}")
            if "dwell_time_seconds" in telemetry:
                prompt_parts.append(f"- Time on task: {telemetry['dwell_time_seconds']}s")
            if "attempt_count" in telemetry:
                prompt_parts.append(f"- Attempts: {telemetry['attempt_count']}")
        
        # STEP 7: Add instruction based on scaffolding level
        if rule_decision.scaffolding_level == ScaffoldingLevel.MINIMAL:
            prompt_parts.append(
                "\nInstruction: Student is doing well. Give a brief hint or "
                "encouraging question. Do NOT give away the answer."
            )
        elif rule_decision.scaffolding_level == ScaffoldingLevel.MODERATE:
            prompt_parts.append(
                "\nInstruction: Student needs guidance. Ask a Socratic question "
                "that leads them toward the concept. Reference their specific actions."
            )
        elif rule_decision.scaffolding_level == ScaffoldingLevel.SUBSTANTIAL:
            prompt_parts.append(
                "\nInstruction: Student is frustrated. Break down the problem into "
                "smaller steps. Provide conceptual explanation with examples."
            )
        else:
            prompt_parts.append(
                "\nInstruction: Give a 3-6 sentence answer that explains the concept "
                "and walks through the steps."
            )
        
        return "\n".join(prompt_parts)
    
    def _extract_examples(self, response: str) -> List[str]:
        """Extract cultural examples used in the response.
        
        This helps track which examples work best in different contexts.
        """
        examples = []
        
        # Common Kenyan examples to track
        kenyan_terms = [
            "matatu", "shamba", "ugali", "shilling", "m-pesa",
            "nairobi", "mombasa", "kisumu", "boda boda",
            "maize", "sukuma wiki", "mandazi", "chapati"
        ]
        
        response_lower = response.lower()
        for term in kenyan_terms:
            if term in response_lower:
                examples.append(term)
        
        return examples
