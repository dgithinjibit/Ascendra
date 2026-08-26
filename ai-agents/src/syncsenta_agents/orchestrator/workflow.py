"""LangGraph workflow orchestration for SyncSenta AI Agents."""

from typing import Dict, Any, List, TypedDict, Annotated, Sequence
from datetime import datetime
import asyncio
from enum import Enum

import os

from langgraph.graph import StateGraph, END
try:
    from langchain.schema import BaseMessage, HumanMessage, AIMessage, SystemMessage
except ImportError:  # langchain >= 1.0
    from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_community.llms import Ollama

from ..core.models import (
    AgentRequest,
    AgentResponse,
    AgentType,
    MessageType,
    RequestPriority,
    ConversationContext
)
from ..core.config import config
from ..core.logging import AgentLogger
from ..core.exceptions import AgentError, OrchestratorError


class RoutingDecision(str, Enum):
    """Routing decisions for agent selection."""
    SOCRATIC_TUTOR = "socratic_tutor"
    CBC_CURRICULUM = "cbc_curriculum"
    LESSON_ARCHITECT = "lesson_architect"
    ASSESSMENT = "assessment"
    SCHOOL_INTELLIGENCE = "school_intelligence"
    CAREER_PATHWAYS = "career_pathways"
    CULTURAL_LOCALIZATION = "cultural_localization"
    EQUITY_INCLUSION = "equity_inclusion"
    PERSONA_MOTIVATION = "persona_motivation"
    MASTERY = "mastery"
    CREATIVITY_INNOVATION = "creativity_innovation"
    SEL = "sel"
    REAL_WORLD_PROBLEM_SOLVER = "real_world_problem_solver"
    TEACHER_SUPPORT = "teacher_support"
    CREDENTIAL_VERIFICATION = "credential_verification"
    COORDINATOR = "coordinator"
    MULTI_AGENT = "multi_agent"
    ERROR = "error"


class AgentState(TypedDict):
    """State maintained throughout the workflow."""
    messages: Sequence[BaseMessage]
    current_agent: str
    context: Dict[str, Any]
    user_id: str
    session_id: str
    routing_decision: str
    agent_responses: Dict[str, Any]
    error: str | None
    retry_count: int
    start_time: float
    conversation_context: Dict[str, Any]


class LangGraphOrchestrator:
    """LangGraph-based workflow orchestration system."""
    
    def __init__(self):
        """Initialize the orchestrator with workflow graph."""
        self.logger = AgentLogger("langgraph_orchestrator")
        self.workflow = StateGraph(AgentState)
        self.agent_registry: Dict[str, Any] = {}
        self.conversation_contexts: Dict[str, ConversationContext] = {}
        
        # Use Groq when configured; keep local/offline development deterministic
        # instead of constructing a client with a missing credential.
        self.analysis_llm = None
        groq_api_key = os.getenv("GROQ_API_KEY")
        if groq_api_key and groq_api_key != "test-key-offline":
            from langchain_groq import ChatGroq
            self.analysis_llm = ChatGroq(
                model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                api_key=groq_api_key,
                temperature=0.3,
            )
            self.logger.info("Using Groq for orchestration")
        else:
            self.logger.info("No GROQ_API_KEY configured; using deterministic offline routing")
        
        self._setup_workflow()
        self.compiled_workflow = self.workflow.compile()
        
        self.logger.info("LangGraph orchestrator initialized")
    
    def _setup_workflow(self) -> None:
        """Set up the workflow graph with nodes and edges."""
        # Add workflow nodes
        self.workflow.add_node("analyze_request", self._analyze_request)
        self.workflow.add_node("execute_socratic", self._execute_socratic_agent)
        self.workflow.add_node("execute_curriculum", self._execute_curriculum_agent)
        self.workflow.add_node("execute_lesson", self._execute_lesson_agent)
        self.workflow.add_node("execute_assessment", self._execute_assessment_agent)
        self.workflow.add_node("execute_intelligence", self._execute_intelligence_agent)
        self.workflow.add_node("execute_career", self._execute_career_agent)
        self.workflow.add_node("execute_cultural_localization", self._execute_cultural_localization_agent)
        self.workflow.add_node("execute_equity_inclusion", self._execute_equity_inclusion_agent)
        self.workflow.add_node("execute_persona_motivation", self._execute_persona_motivation_agent)
        self.workflow.add_node("execute_mastery", self._execute_mastery_agent)
        self.workflow.add_node("execute_creativity_innovation", self._execute_creativity_innovation_agent)
        self.workflow.add_node("execute_sel", self._execute_sel_agent)
        self.workflow.add_node("execute_real_world_problem_solver", self._execute_real_world_problem_solver_agent)
        self.workflow.add_node("execute_teacher_support", self._execute_teacher_support_agent)
        self.workflow.add_node("execute_credential_verification", self._execute_credential_verification_agent)
        self.workflow.add_node("execute_coordinator", self._execute_coordinator_agent)
        self.workflow.add_node("execute_multi_agent", self._execute_multi_agent)
        self.workflow.add_node("synthesize_response", self._synthesize_response)
        self.workflow.add_node("handle_error", self._handle_error)
        
        # Set entry point
        self.workflow.set_entry_point("analyze_request")
        
        # Add conditional routing from analysis
        self.workflow.add_conditional_edges(
            "analyze_request",
            self._should_route,
            {
                RoutingDecision.SOCRATIC_TUTOR: "execute_socratic",
                RoutingDecision.CBC_CURRICULUM: "execute_curriculum",
                RoutingDecision.LESSON_ARCHITECT: "execute_lesson",
                RoutingDecision.ASSESSMENT: "execute_assessment",
                RoutingDecision.SCHOOL_INTELLIGENCE: "execute_intelligence",
                RoutingDecision.CAREER_PATHWAYS: "execute_career",
                RoutingDecision.CULTURAL_LOCALIZATION: "execute_cultural_localization",
                RoutingDecision.EQUITY_INCLUSION: "execute_equity_inclusion",
                RoutingDecision.PERSONA_MOTIVATION: "execute_persona_motivation",
                RoutingDecision.MASTERY: "execute_mastery",
                RoutingDecision.CREATIVITY_INNOVATION: "execute_creativity_innovation",
                RoutingDecision.SEL: "execute_sel",
                RoutingDecision.REAL_WORLD_PROBLEM_SOLVER: "execute_real_world_problem_solver",
                RoutingDecision.TEACHER_SUPPORT: "execute_teacher_support",
                RoutingDecision.CREDENTIAL_VERIFICATION: "execute_credential_verification",
                RoutingDecision.COORDINATOR: "execute_coordinator",
                RoutingDecision.MULTI_AGENT: "execute_multi_agent",
                RoutingDecision.ERROR: "handle_error"
            }
        )
        
        # All agent execution nodes go to synthesis
        for agent_node in [
            "execute_socratic", "execute_curriculum", "execute_lesson",
            "execute_assessment", "execute_intelligence", "execute_career",
            "execute_cultural_localization", "execute_equity_inclusion",
            "execute_persona_motivation", "execute_mastery",
            "execute_creativity_innovation", "execute_sel",
            "execute_real_world_problem_solver", "execute_teacher_support",
            "execute_credential_verification", "execute_coordinator",
            "execute_multi_agent"
        ]:
            self.workflow.add_edge(agent_node, "synthesize_response")
        
        # Synthesis and error handling go to END
        self.workflow.add_edge("synthesize_response", END)
        self.workflow.add_edge("handle_error", END)
    
    async def _analyze_request(self, state: AgentState) -> AgentState:
        """Analyze incoming request and determine routing strategy."""
        try:
            last_message = state["messages"][-1]
            user_message = last_message.content if hasattr(last_message, 'content') else str(last_message)
            
            # Get conversation context
            user_id = state["user_id"]
            conv_context = self.conversation_contexts.get(user_id)
            
            # Build analysis prompt
            analysis_prompt = self._build_analysis_prompt(
                user_message,
                state["context"],
                conv_context
            )
            
            # Use LLM to classify request
            classification_result = await self._classify_request(analysis_prompt)
            
            # Update state with routing decision
            state["routing_decision"] = classification_result["agent_type"]
            state["context"]["analysis"] = {
                "request_type": classification_result["agent_type"],
                "confidence": classification_result.get("confidence", 0.95),
                "reasoning": classification_result.get("reasoning", ""),
                "timestamp": datetime.now().isoformat(),
                "requires_multi_agent": classification_result.get("multi_agent", False)
            }
            
            # Update conversation context
            if conv_context:
                conv_context.conversation_history.append({
                    "timestamp": datetime.now().isoformat(),
                    "message": user_message,
                    "routing": classification_result["agent_type"]
                })
                conv_context.updated_at = datetime.now()
            
            self.logger.info(
                "Request analyzed",
                routing=classification_result["agent_type"],
                confidence=classification_result.get("confidence")
            )
            
            return state
            
        except Exception as e:
            self.logger.error("Request analysis failed", error=str(e))
            state["error"] = f"Analysis failed: {str(e)}"
            state["routing_decision"] = RoutingDecision.ERROR
            return state
    
    def _build_analysis_prompt(
        self,
        user_message: str,
        context: Dict[str, Any],
        conv_context: ConversationContext | None
    ) -> str:
        """Build prompt for request classification."""
        prompt = f"""You are an intelligent request router for SyncSenta Education OS.
Analyze the following student/teacher request and determine which AI agent should handle it.

Available Agents:
1. SOCRATIC_TUTOR - For student questions, tutoring, homework help, concept explanations
2. CBC_CURRICULUM - For curriculum queries, learning outcomes, CBC standards, KICD references
3. LESSON_ARCHITECT - For lesson planning, schemes of work, worksheet generation
4. ASSESSMENT - For quiz generation, grading, rubric creation, feedback
5. SCHOOL_INTELLIGENCE - For analytics, reports, performance insights, admin queries
6. CAREER_PATHWAYS - For career guidance, pathway recommendations, aptitude assessment
7. CULTURAL_LOCALIZATION - For adapting content to local Kenyan culture and language
8. EQUITY_INCLUSION - For inclusive, accessible, and bias-aware learning support
9. PERSONA_MOTIVATION - For learner motivation, aspiration, and persona-driven coaching
10. MASTERY - For competency progression, mastery planning, and long-term learning roadmaps
11. CREATIVITY_INNOVATION - For creative projects, innovation challenges, and portfolio activities
12. SEL - For social-emotional learning, mindset, and wellbeing support
13. REAL_WORLD_PROBLEM_SOLVER - For linking learning to real-world local challenges
14. TEACHER_SUPPORT - For teacher coaching, lesson adaptation, and classroom strategies
15. CREDENTIAL_VERIFICATION - For evidence-based credential pathways and verification guidance
16. COORDINATOR - For coordinating multiple agents into one coherent learning plan
17. MULTI_AGENT - For complex requests requiring multiple agents

User Request: {user_message}

Context:
- Role: {context.get('role', 'student')}
- Grade: {context.get('grade', 'unknown')}
- Subject: {context.get('subject', 'unknown')}
"""
        
        if conv_context and conv_context.conversation_history:
            recent_history = conv_context.conversation_history[-3:]
            prompt += f"\nRecent Conversation:\n"
            for entry in recent_history:
                prompt += f"- {entry.get('message', '')[:100]}\n"
        
        prompt += """
Respond with ONLY the agent name (e.g., SOCRATIC_TUTOR) that should handle this request.
If multiple agents are needed, respond with MULTI_AGENT.
"""
        
        return prompt
    
    async def _classify_request(self, prompt: str) -> Dict[str, Any]:
        """Use LLM to classify the request."""
        if os.environ.get("SYNCSENTA_OFFLINE_DEMO") == "1":
            # Skip Ollama — keyword-route so offline demo works without a model.
            return {
                "agent_type": self._keyword_route(prompt),
                "confidence": 0.6,
                "reasoning": "offline-demo keyword routing",
                "multi_agent": False,
            }
        try:
            if self.analysis_llm is None:
                return {
                    "agent_type": self._keyword_route(prompt),
                    "confidence": 0.6,
                    "reasoning": "deterministic routing without provider credentials",
                    "multi_agent": False,
                }
            # Get LLM response
            response = await asyncio.to_thread(
                self.analysis_llm.invoke,
                prompt
            )
            
            # Parse response - extract content from AIMessage
            if hasattr(response, 'content'):
                agent_type = response.content.strip().upper()
            else:
                agent_type = str(response).strip().upper()
            
            # Map to routing decision
            routing_map = {
                "SOCRATIC_TUTOR": RoutingDecision.SOCRATIC_TUTOR,
                "CBC_CURRICULUM": RoutingDecision.CBC_CURRICULUM,
                "LESSON_ARCHITECT": RoutingDecision.LESSON_ARCHITECT,
                "ASSESSMENT": RoutingDecision.ASSESSMENT,
                "SCHOOL_INTELLIGENCE": RoutingDecision.SCHOOL_INTELLIGENCE,
                "CAREER_PATHWAYS": RoutingDecision.CAREER_PATHWAYS,
                "CULTURAL_LOCALIZATION": RoutingDecision.CULTURAL_LOCALIZATION,
                "EQUITY_INCLUSION": RoutingDecision.EQUITY_INCLUSION,
                "PERSONA_MOTIVATION": RoutingDecision.PERSONA_MOTIVATION,
                "MASTERY": RoutingDecision.MASTERY,
                "CREATIVITY_INNOVATION": RoutingDecision.CREATIVITY_INNOVATION,
                "SEL": RoutingDecision.SEL,
                "REAL_WORLD_PROBLEM_SOLVER": RoutingDecision.REAL_WORLD_PROBLEM_SOLVER,
                "TEACHER_SUPPORT": RoutingDecision.TEACHER_SUPPORT,
                "CREDENTIAL_VERIFICATION": RoutingDecision.CREDENTIAL_VERIFICATION,
                "COORDINATOR": RoutingDecision.COORDINATOR,
                "MULTI_AGENT": RoutingDecision.MULTI_AGENT
            }
            
            decision = routing_map.get(agent_type, RoutingDecision.SOCRATIC_TUTOR)
            
            return {
                "agent_type": decision,
                "confidence": 0.95,
                "reasoning": f"Classified as {decision}",
                "multi_agent": decision == RoutingDecision.MULTI_AGENT
            }
            
        except Exception as e:
            self.logger.error("Classification failed", error=str(e))
            # Default to Socratic tutor on error
            return {
                "agent_type": RoutingDecision.SOCRATIC_TUTOR,
                "confidence": 0.5,
                "reasoning": f"Defaulted due to error: {str(e)}",
                "multi_agent": False
            }
    
    def _should_route(self, state: AgentState) -> str:
        """Determine which node to route to based on analysis."""
        return state["routing_decision"]

    def _keyword_route(self, prompt: str) -> str:
        """Cheap deterministic router used when no LLM is available."""
        text = prompt.lower()
        if "user request:" in text:
            text = text.split("user request:", 1)[1].split("context:", 1)[0]
        if any(k in text for k in ("quiz", "test me", "grade this", "mark this", "score this", "assessment")):
            return RoutingDecision.ASSESSMENT
        if any(k in text for k in ("lesson plan", "scheme of work", "worksheet")):
            return RoutingDecision.LESSON_ARCHITECT
        if any(k in text for k in ("career", "pathway", "what should i become")):
            return RoutingDecision.CAREER_PATHWAYS
        if any(k in text for k in ("cultural", "local", "ethnic", "region", "language")):
            return RoutingDecision.CULTURAL_LOCALIZATION
        if any(k in text for k in ("inclusive", "equity", "bias", "accessible", "disability")):
            return RoutingDecision.EQUITY_INCLUSION
        if any(k in text for k in ("aspiration", "motiv", "role model", "dream", "future leader")):
            return RoutingDecision.PERSONA_MOTIVATION
        if any(k in text for k in ("mastery", "spaced repetition", "long-term", "progression", "competency roadmap")):
            return RoutingDecision.MASTERY
        if any(k in text for k in ("creative", "innovation", "project", "portfolio", "challenge")):
            return RoutingDecision.CREATIVITY_INNOVATION
        if any(k in text for k in ("emotion", "mindset", "confidence", "stress", "resilience")):
            return RoutingDecision.SEL
        if any(k in text for k in ("community challenge", "real world", "local problem", "sustainability", "impact")):
            return RoutingDecision.REAL_WORLD_PROBLEM_SOLVER
        if any(k in text for k in ("teacher support", "classroom strategy", "lesson feedback", "teacher coach")):
            return RoutingDecision.TEACHER_SUPPORT
        if any(k in text for k in ("credential", "certificate", "verify achievement", "proof of learning")):
            return RoutingDecision.CREDENTIAL_VERIFICATION
        if any(k in text for k in ("coordinate", "orchestrate", "multi-agent", "combined plan")):
            return RoutingDecision.COORDINATOR
        return RoutingDecision.SOCRATIC_TUTOR
    
    async def _execute_socratic_agent(self, state: AgentState) -> AgentState:
        """Execute Socratic Tutor agent."""
        try:
            self.logger.info("Executing Socratic Tutor agent")
            
            # Get agent from registry
            agent = self.agent_registry.get("socratic_tutor")
            
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["socratic_tutor"] = response
            else:
                # Placeholder response if agent not registered
                state["agent_responses"]["socratic_tutor"] = {
                    "response": "Socratic Tutor agent not yet implemented",
                    "agent": "socratic_tutor"
                }
            
            state["current_agent"] = "socratic_tutor"
            return state
            
        except Exception as e:
            self.logger.error("Socratic agent execution failed", error=str(e))
            state["error"] = f"Socratic agent failed: {str(e)}"
            return state
    
    async def _execute_curriculum_agent(self, state: AgentState) -> AgentState:
        """Execute CBC Curriculum agent."""
        try:
            self.logger.info("Executing CBC Curriculum agent")
            
            agent = self.agent_registry.get("cbc_curriculum")
            
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["cbc_curriculum"] = response
            else:
                state["agent_responses"]["cbc_curriculum"] = {
                    "response": "CBC Curriculum agent not yet implemented",
                    "agent": "cbc_curriculum"
                }
            
            state["current_agent"] = "cbc_curriculum"
            return state
            
        except Exception as e:
            self.logger.error("Curriculum agent execution failed", error=str(e))
            state["error"] = f"Curriculum agent failed: {str(e)}"
            return state
    
    async def _execute_lesson_agent(self, state: AgentState) -> AgentState:
        """Execute Lesson Architect agent."""
        try:
            self.logger.info("Executing Lesson Architect agent")
            
            agent = self.agent_registry.get("lesson_architect")
            
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["lesson_architect"] = response
            else:
                state["agent_responses"]["lesson_architect"] = {
                    "response": "Lesson Architect agent not registered. Please register the agent in main.py",
                    "agent": "lesson_architect"
                }
            
            state["current_agent"] = "lesson_architect"
            return state
            
        except Exception as e:
            self.logger.error("Lesson agent execution failed", error=str(e))
            state["error"] = f"Lesson agent failed: {str(e)}"
            return state
    
    async def _execute_assessment_agent(self, state: AgentState) -> AgentState:
        """Execute Assessment agent."""
        try:
            self.logger.info("Executing Assessment agent")
            
            agent = self.agent_registry.get("assessment")
            
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["assessment"] = response
            else:
                state["agent_responses"]["assessment"] = {
                    "response": "Assessment agent not yet implemented",
                    "agent": "assessment"
                }
            
            state["current_agent"] = "assessment"
            return state
            
        except Exception as e:
            self.logger.error("Assessment agent execution failed", error=str(e))
            state["error"] = f"Assessment agent failed: {str(e)}"
            return state
    
    async def _execute_intelligence_agent(self, state: AgentState) -> AgentState:
        """Execute School Intelligence agent."""
        try:
            self.logger.info("Executing School Intelligence agent")
            
            agent = self.agent_registry.get("school_intelligence")
            
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["school_intelligence"] = response
            else:
                state["agent_responses"]["school_intelligence"] = {
                    "response": "School Intelligence agent not yet implemented",
                    "agent": "school_intelligence"
                }
            
            state["current_agent"] = "school_intelligence"
            return state
            
        except Exception as e:
            self.logger.error("Intelligence agent execution failed", error=str(e))
            state["error"] = f"Intelligence agent failed: {str(e)}"
            return state
    
    async def _execute_career_agent(self, state: AgentState) -> AgentState:
        """Execute Career Pathways agent."""
        try:
            self.logger.info("Executing Career Pathways agent")
            
            agent = self.agent_registry.get("career_pathways")
            
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["career_pathways"] = response
            else:
                state["agent_responses"]["career_pathways"] = {
                    "response": "Career Pathways agent not yet implemented",
                    "agent": "career_pathways"
                }
            
            state["current_agent"] = "career_pathways"
            return state
            
        except Exception as e:
            self.logger.error("Career agent execution failed", error=str(e))
            state["error"] = f"Career agent failed: {str(e)}"
            return state

    async def _execute_cultural_localization_agent(self, state: AgentState) -> AgentState:
        """Execute Cultural Localization agent."""
        try:
            self.logger.info("Executing Cultural Localization agent")
            agent = self.agent_registry.get("cultural_localization")
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["cultural_localization"] = response
            else:
                state["agent_responses"]["cultural_localization"] = {
                    "response": "Cultural Localization agent not yet implemented",
                    "agent": "cultural_localization"
                }
            state["current_agent"] = "cultural_localization"
            return state
        except Exception as e:
            self.logger.error("Cultural Localization agent execution failed", error=str(e))
            state["error"] = f"Cultural Localization agent failed: {str(e)}"
            return state

    async def _execute_equity_inclusion_agent(self, state: AgentState) -> AgentState:
        """Execute Equity Inclusion agent."""
        try:
            self.logger.info("Executing Equity Inclusion agent")
            agent = self.agent_registry.get("equity_inclusion")
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["equity_inclusion"] = response
            else:
                state["agent_responses"]["equity_inclusion"] = {
                    "response": "Equity Inclusion agent not yet implemented",
                    "agent": "equity_inclusion"
                }
            state["current_agent"] = "equity_inclusion"
            return state
        except Exception as e:
            self.logger.error("Equity Inclusion agent execution failed", error=str(e))
            state["error"] = f"Equity Inclusion agent failed: {str(e)}"
            return state

    async def _execute_persona_motivation_agent(self, state: AgentState) -> AgentState:
        """Execute Persona Motivation agent."""
        try:
            self.logger.info("Executing Persona Motivation agent")
            agent = self.agent_registry.get("persona_motivation")
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["persona_motivation"] = response
            else:
                state["agent_responses"]["persona_motivation"] = {
                    "response": "Persona Motivation agent not yet implemented",
                    "agent": "persona_motivation"
                }
            state["current_agent"] = "persona_motivation"
            return state
        except Exception as e:
            self.logger.error("Persona Motivation agent execution failed", error=str(e))
            state["error"] = f"Persona Motivation agent failed: {str(e)}"
            return state

    async def _execute_mastery_agent(self, state: AgentState) -> AgentState:
        """Execute Mastery agent."""
        try:
            self.logger.info("Executing Mastery agent")
            agent = self.agent_registry.get("mastery")
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["mastery"] = response
            else:
                state["agent_responses"]["mastery"] = {
                    "response": "Mastery agent not yet implemented",
                    "agent": "mastery"
                }
            state["current_agent"] = "mastery"
            return state
        except Exception as e:
            self.logger.error("Mastery agent execution failed", error=str(e))
            state["error"] = f"Mastery agent failed: {str(e)}"
            return state

    async def _execute_creativity_innovation_agent(self, state: AgentState) -> AgentState:
        """Execute Creativity & Innovation agent."""
        try:
            self.logger.info("Executing Creativity & Innovation agent")
            agent = self.agent_registry.get("creativity_innovation")
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["creativity_innovation"] = response
            else:
                state["agent_responses"]["creativity_innovation"] = {
                    "response": "Creativity & Innovation agent not yet implemented",
                    "agent": "creativity_innovation"
                }
            state["current_agent"] = "creativity_innovation"
            return state
        except Exception as e:
            self.logger.error("Creativity & Innovation execution failed", error=str(e))
            state["error"] = f"Creativity & Innovation agent failed: {str(e)}"
            return state

    async def _execute_sel_agent(self, state: AgentState) -> AgentState:
        """Execute Social Emotional Learning agent."""
        try:
            self.logger.info("Executing SEL agent")
            agent = self.agent_registry.get("sel")
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["sel"] = response
            else:
                state["agent_responses"]["sel"] = {
                    "response": "SEL agent not yet implemented",
                    "agent": "sel"
                }
            state["current_agent"] = "sel"
            return state
        except Exception as e:
            self.logger.error("SEL agent execution failed", error=str(e))
            state["error"] = f"SEL agent failed: {str(e)}"
            return state

    async def _execute_real_world_problem_solver_agent(self, state: AgentState) -> AgentState:
        """Execute Real-World Problem Solver agent."""
        try:
            self.logger.info("Executing Real-World Problem Solver agent")
            agent = self.agent_registry.get("real_world_problem_solver")
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["real_world_problem_solver"] = response
            else:
                state["agent_responses"]["real_world_problem_solver"] = {
                    "response": "Real-World Problem Solver agent not yet implemented",
                    "agent": "real_world_problem_solver"
                }
            state["current_agent"] = "real_world_problem_solver"
            return state
        except Exception as e:
            self.logger.error("Real-World Problem Solver execution failed", error=str(e))
            state["error"] = f"Real-World Problem Solver agent failed: {str(e)}"
            return state

    async def _execute_teacher_support_agent(self, state: AgentState) -> AgentState:
        """Execute Teacher Support agent."""
        try:
            self.logger.info("Executing Teacher Support agent")
            agent = self.agent_registry.get("teacher_support")
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["teacher_support"] = response
            else:
                state["agent_responses"]["teacher_support"] = {
                    "response": "Teacher Support agent not yet implemented",
                    "agent": "teacher_support"
                }
            state["current_agent"] = "teacher_support"
            return state
        except Exception as e:
            self.logger.error("Teacher Support execution failed", error=str(e))
            state["error"] = f"Teacher Support agent failed: {str(e)}"
            return state

    async def _execute_credential_verification_agent(self, state: AgentState) -> AgentState:
        """Execute Credential Verification agent."""
        try:
            self.logger.info("Executing Credential Verification agent")
            agent = self.agent_registry.get("credential_verification")
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["credential_verification"] = response
            else:
                state["agent_responses"]["credential_verification"] = {
                    "response": "Credential Verification agent not yet implemented",
                    "agent": "credential_verification"
                }
            state["current_agent"] = "credential_verification"
            return state
        except Exception as e:
            self.logger.error("Credential Verification execution failed", error=str(e))
            state["error"] = f"Credential Verification agent failed: {str(e)}"
            return state

    async def _execute_coordinator_agent(self, state: AgentState) -> AgentState:
        """Execute Coordinator agent."""
        try:
            self.logger.info("Executing Coordinator agent")
            agent = self.agent_registry.get("coordinator")
            if agent:
                response = await agent.execute_task(
                    request=state["messages"][-1].content,
                    context=state["context"]
                )
                state["agent_responses"]["coordinator"] = response
            else:
                state["agent_responses"]["coordinator"] = {
                    "response": "Coordinator agent not yet implemented",
                    "agent": "coordinator"
                }
            state["current_agent"] = "coordinator"
            return state
        except Exception as e:
            self.logger.error("Coordinator execution failed", error=str(e))
            state["error"] = f"Coordinator agent failed: {str(e)}"
            return state

    async def _execute_multi_agent(self, state: AgentState) -> AgentState:
        """Execute multiple agents for complex requests."""
        try:
            self.logger.info("Executing multi-agent coordination")
            
            # Determine which agents are needed
            agents_needed = self._determine_required_agents(state)
            
            # Execute agents in parallel or sequence based on dependencies
            responses = {}
            for agent_name in agents_needed:
                agent = self.agent_registry.get(agent_name)
                if agent:
                    response = await agent.execute_task(
                        request=state["messages"][-1].content,
                        context=state["context"]
                    )
                    responses[agent_name] = response
            
            state["agent_responses"] = responses
            state["current_agent"] = "multi_agent"
            return state
            
        except Exception as e:
            self.logger.error("Multi-agent execution failed", error=str(e))
            state["error"] = f"Multi-agent coordination failed: {str(e)}"
            return state
    
    def _determine_required_agents(self, state: AgentState) -> List[str]:
        """Determine which agents are needed for multi-agent requests."""
        # Simple heuristic - can be enhanced with LLM analysis
        context = state["context"]
        agents = []
        
        # Always include curriculum agent for educational content
        agents.append("cbc_curriculum")
        
        # Add based on role
        role = context.get("role", "student")
        if role == "student":
            agents.append("socratic_tutor")
        elif role == "teacher":
            agents.extend(["lesson_architect", "assessment"])
        elif role == "admin":
            agents.append("school_intelligence")
        
        return agents
    
    async def _synthesize_response(self, state: AgentState) -> AgentState:
        """Synthesize responses from multiple agents into coherent output."""
        try:
            self.logger.info("Synthesizing agent responses")
            
            agent_responses = state["agent_responses"]
            
            if len(agent_responses) == 1:
                # Single agent response - use directly
                agent_name, response = list(agent_responses.items())[0]
                synthesized = response.get("response", str(response))
            else:
                # Multiple agent responses - synthesize
                synthesized = await self._synthesize_multi_agent_responses(
                    agent_responses,
                    state["context"]
                )
            
            # Create final message
            final_message = AIMessage(content=synthesized)
            state["messages"].append(final_message)
            
            # Calculate response time
            response_time = int((datetime.now().timestamp() - state["start_time"]) * 1000)
            state["context"]["response_time_ms"] = response_time
            
            self.logger.info(
                "Response synthesized",
                response_time_ms=response_time,
                agents_used=list(agent_responses.keys())
            )
            
            return state
            
        except Exception as e:
            error_text = str(e)
            self.logger.error("Response synthesis failed", error=error_text)
            provider_unavailable = any(
                marker in error_text.lower()
                for marker in ("invalid_api_key", "api key", "forbidden", "401", "403")
            )
            if provider_unavailable:
                agent_name = str(
                    state.get("current_agent")
                    or state.get("routing_decision")
                    or "orchestrator"
                )
                state["agent_responses"].setdefault(
                    agent_name,
                    {"response": "The learning assistant is temporarily offline. Please try again shortly."},
                )
                state["current_agent"] = agent_name
                state["context"]["provider_degraded"] = True
                state["error"] = None
                state["messages"].append(
                    AIMessage(content="The learning assistant is temporarily offline. Please try again shortly.")
                )
                state["context"]["response_time_ms"] = int(
                    (datetime.now().timestamp() - state["start_time"]) * 1000
                )
                return state
            state["error"] = f"Synthesis failed: {error_text}"
            return state
    
    async def _synthesize_multi_agent_responses(
        self,
        responses: Dict[str, Any],
        context: Dict[str, Any]
    ) -> str:
        """Synthesize multiple agent responses into coherent output."""
        # Offline demo: skip the LLM synthesis call (Ollama unreachable) and
        # concatenate agent outputs deterministically.
        if os.environ.get("SYNCSENTA_OFFLINE_DEMO") == "1":
            parts = []
            for agent_name, response in responses.items():
                text = response.get("response", str(response)).strip()
                if text:
                    parts.append(text)
            return "\n\n".join(parts)

        synthesis_prompt = """You are synthesizing responses from multiple AI agents into a coherent answer.
Combine the following agent responses into a single, well-structured response:

"""

        for agent_name, response in responses.items():
            response_text = response.get("response", str(response))
            synthesis_prompt += f"\n{agent_name.upper()}:\n{response_text}\n"

        synthesis_prompt += """
Create a coherent, educational response that:
1. Maintains CBC curriculum alignment
2. Preserves Kenyan cultural context
3. Provides clear, actionable information
4. Flows naturally without mentioning individual agents
"""

        if self.analysis_llm is None:
            parts = []
            for response in responses.values():
                text = response.get("response", str(response)).strip()
                if text:
                    parts.append(text)
            return "\n\n".join(parts)
        synthesized = await asyncio.to_thread(
            self.analysis_llm.invoke,
            synthesis_prompt,
        )

        # Extract content from AIMessage
        if hasattr(synthesized, 'content'):
            return synthesized.content.strip()
        return str(synthesized).strip()
    
    async def _handle_error(self, state: AgentState) -> AgentState:
        """Handle errors with graceful fallback."""
        try:
            error_msg = state.get("error", "Unknown error occurred")
            self.logger.error("Handling workflow error", error=error_msg)
            
            # Create error response message
            error_response = f"""I apologize, but I encountered an issue processing your request.

Error: {error_msg}

Please try rephrasing your question, or contact support if the issue persists.
"""
            
            error_message = AIMessage(content=error_response)
            state["messages"].append(error_message)
            
            return state
            
        except Exception as e:
            self.logger.error("Error handler failed", error=str(e))
            # Last resort fallback
            state["messages"].append(
                AIMessage(content="A system error occurred. Please try again later.")
            )
            return state
    
    def register_agent(self, agent_name: str, agent: Any) -> None:
        """Register an agent with the orchestrator."""
        self.agent_registry[agent_name] = agent
        self.logger.info(f"Registered agent: {agent_name}")
    
    async def process_request(self, request: AgentRequest) -> AgentResponse:
        """Process a request through the workflow."""
        start_time = datetime.now().timestamp()
        
        try:
            # Initialize state
            initial_state: AgentState = {
                "messages": [HumanMessage(content=request.message)],
                "current_agent": "",
                "context": request.context or {},
                "user_id": request.user_id,
                "session_id": request.session_id or f"session_{int(start_time)}",
                "routing_decision": "",
                "agent_responses": {},
                "error": None,
                "retry_count": 0,
                "start_time": start_time,
                "conversation_context": {}
            }
            
            # Add request metadata to context.
            #
            # teacher_id resolution:
            #   - For teacher-authored work (lesson_architect, etc.) the caller
            #     IS the teacher, so user_id doubles as teacher_id.
            #   - For student tutoring, request.teacher_id carries the student's
            #     assigned teacher (resolved upstream in /agents/chat) so the
            #     logged AI decision reaches that teacher's feedback dashboard.
            # Prefer an explicit teacher_id; only fall back to user_id when the
            # request is not from a student (i.e. the caller is the teacher).
            if request.teacher_id:
                teacher_id = request.teacher_id
            elif request.role == "student":
                teacher_id = None  # unresolved: don't misattribute to the student
            else:
                teacher_id = request.user_id

            initial_state["context"].update({
                "grade": request.grade,
                "subject": request.subject,
                "role": request.role,
                "type": request.type,
                "priority": request.priority,
                "user_id": request.user_id,
                "teacher_id": teacher_id,
            })
            
            # Get or create conversation context
            if request.user_id not in self.conversation_contexts:
                self.conversation_contexts[request.user_id] = ConversationContext(
                    user_id=request.user_id
                )
            
            # Execute workflow
            final_state = await self.compiled_workflow.ainvoke(initial_state)
            
            # Extract response
            response_message = final_state["messages"][-1]
            response_text = response_message.content if hasattr(response_message, 'content') else str(response_message)
            
            # Calculate response time
            response_time = int((datetime.now().timestamp() - start_time) * 1000)
            
            # Build response
            return AgentResponse(
                success=final_state.get("error") is None,
                response=response_text,
                primary_agent=final_state.get("current_agent", "orchestrator"),
                agents_used=list(final_state.get("agent_responses", {}).keys()),
                response_time_ms=response_time,
                context_aware=True,
                coordination=final_state.get("context", {}).get("analysis"),
                fallback_used=final_state.get("error") is not None,
                error=final_state.get("error")
            )
            
        except Exception as e:
            self.logger.error("Request processing failed", error=str(e))
            response_time = int((datetime.now().timestamp() - start_time) * 1000)
            
            return AgentResponse(
                success=False,
                response=f"Failed to process request: {str(e)}",
                primary_agent="orchestrator",
                agents_used=["orchestrator"],
                response_time_ms=response_time,
                error=str(e),
                fallback_used=True
            )
