"""MeTTa Reasoning Engine - Dynamic, evolvable pedagogical rules.

MeTTa (Meta Type Talk) provides a symbolic reasoning layer that can:
1. Store rules as data (not hardcoded)
2. Learn new rules from teacher feedback
3. Reason over rules to make decisions
4. Export/import rules for versioning

This is the "reusable, not permanent" layer — rules can be added,
modified, or removed based on teacher feedback without code changes.

Two layers work together:

* **Policy layer** — ``HyperonPolicyEvaluator`` (or its pure-Python
  fallback) enforces the *syncsenta_policy.metta* safeguarding and
  consent rules before any pedagogical decision is made.

* **Pedagogical layer** — ``MeTTaEngine`` stores and evaluates the
  telemetry-driven rules (frustration detection, cultural examples,
  scaffolding selection) that guide *how* to teach once the policy
  gate has approved the session.
"""

from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
import json
from pathlib import Path

from ..core.logging import AgentLogger
from .hyperon_evaluator import (
    get_policy_evaluator,
    PolicyRequest,
    PolicyVerdict,
)


@dataclass
class MeTTaRule:
    """A MeTTa rule representation."""
    rule_id: str
    rule_name: str
    conditions: str  # MeTTa expression
    action: str
    confidence: float
    metadata: Dict[str, Any]


class MeTTaEngine:
    """Dynamic reasoning engine using MeTTa-style symbolic rules.

    Rules are stored as data (not code) and can be:
    - Loaded from database
    - Modified based on teacher feedback
    - Exported/imported for versioning
    - Reasoned over for decision-making

    **Policy gate** — before any pedagogical rule is evaluated, the engine
    calls ``HyperonPolicyEvaluator`` (real Hyperon runtime, or pure-Python
    fallback) to enforce the safeguarding/consent/offline-assessment rules
    defined in ``metta-logic/syncsenta_policy.metta``.  A session that does
    not receive ``Approved`` is returned immediately with an empty rule list
    and the policy verdict attached.

    This is a Python implementation of MeTTa concepts.
    When you have 100+ rules, migrate to actual MeTTa/Hyperon for the
    pedagogical layer too.
    """

    def __init__(self, rules_path: Optional[Path] = None):
        self.logger = AgentLogger("metta_engine")
        self.rules: Dict[str, MeTTaRule] = {}
        self.atomspace: Dict[str, Any] = {}  # Simulated atomspace

        # Shared policy evaluator — real Hyperon if installed, else fallback.
        self._policy = get_policy_evaluator()
        self.logger.info(
            f"MeTTaEngine policy gate: {type(self._policy).__name__}"
        )

        # Load rules from file if provided
        if rules_path and rules_path.exists():
            self.load_rules_from_file(rules_path)
        else:
            self._initialize_default_rules()
    
    def _initialize_default_rules(self):
        """Initialize with default pedagogical rules.
        
        These are the seed rules. As teachers provide feedback,
        new rules will be added dynamically.
        """
        
        # Rule 1: Detect frustration
        self.add_rule(MeTTaRule(
            rule_id="R001",
            rule_name="detect_frustration",
            conditions="""
            (and
              (> (get-telemetry erasure_count) 3)
              (> (get-telemetry dwell_time_seconds) 60))
            """,
            action="simplify_problem",
            confidence=0.85,
            metadata={
                "scaffolding_level": "substantial",
                "explanation": "High erasure + long dwell time indicates frustration",
                "applicable_regions": ["all"],
                "applicable_grades": ["all"]
            }
        ))
        
        # Rule 2: Detect flow state
        self.add_rule(MeTTaRule(
            rule_id="R002",
            rule_name="detect_flow",
            conditions="""
            (and
              (= (get-telemetry first_attempt_correct) true)
              (< (get-telemetry time_to_solution_seconds) 30))
            """,
            action="increase_difficulty",
            confidence=0.90,
            metadata={
                "scaffolding_level": "minimal",
                "explanation": "Quick correct answer indicates mastery",
                "applicable_regions": ["all"],
                "applicable_grades": ["all"]
            }
        ))
        
        # Rule 3: Use cultural examples (Kenyan-specific)
        self.add_rule(MeTTaRule(
            rule_id="R101",
            rule_name="use_matatu_for_urban_ratios",
            conditions="""
            (and
              (= (get-context competency) "MATH.RATIOS")
              (= (get-context student_region) "nairobi"))
            """,
            action="use_matatu_fare_examples",
            confidence=0.75,
            metadata={
                "scaffolding_level": "moderate",
                "explanation": "Urban students relate to matatu fares for ratio problems",
                "applicable_regions": ["nairobi", "mombasa", "kisumu"],
                "applicable_grades": ["Grade 4", "Grade 5", "Grade 6"],
                "examples": ["matatu", "fare", "route"]
            }
        ))
        
        # Rule 4: Use agricultural examples (Rural-specific)
        self.add_rule(MeTTaRule(
            rule_id="R102",
            rule_name="use_shamba_for_rural_area",
            conditions="""
            (and
              (= (get-context competency) "MATH.AREA")
              (= (get-context student_region) "rural"))
            """,
            action="use_shamba_examples",
            confidence=0.80,
            metadata={
                "scaffolding_level": "moderate",
                "explanation": "Rural students understand area through farm plots",
                "applicable_regions": ["rural"],
                "applicable_grades": ["Grade 4", "Grade 5", "Grade 6"],
                "examples": ["shamba", "plot", "farm", "maize"]
            }
        ))
        
        self.logger.info(f"Initialized {len(self.rules)} default MeTTa rules")
    
    def add_rule(self, rule: MeTTaRule):
        """Add a rule to the engine (dynamic, not hardcoded)."""
        self.rules[rule.rule_id] = rule
        self.logger.info(f"Added rule: {rule.rule_id} - {rule.rule_name}")
    
    def remove_rule(self, rule_id: str):
        """Remove a rule (e.g., if teacher feedback shows it's ineffective)."""
        if rule_id in self.rules:
            del self.rules[rule_id]
            self.logger.info(f"Removed rule: {rule_id}")
    
    def update_rule_confidence(self, rule_id: str, new_confidence: float):
        """Update rule confidence based on teacher feedback."""
        if rule_id in self.rules:
            old_confidence = self.rules[rule_id].confidence
            self.rules[rule_id].confidence = new_confidence
            self.logger.info(
                f"Updated rule {rule_id} confidence: {old_confidence:.2f} → {new_confidence:.2f}"
            )
    
    def check_policy(
        self,
        age_band: str = "unknown",
        consent: str = "unknown",
        connectivity: str = "online",
        intent: str = "socratic-tutor",
        safety_signal: str = "clear",
        role: str = "student",
        goal: str = "inclusive-learning",
        accessibility: str = "default",
    ) -> PolicyVerdict:
        """Run the MeTTa policy gate before any pedagogical evaluation.

        This is the real Hyperon (or fallback) enforcement of
        ``syncsenta_policy.metta``.  Call this once per session before
        calling ``evaluate()``.

        Returns a ``PolicyVerdict``; ``verdict.approved`` is True only
        when the session is safe to continue.

        Example::

            verdict = engine.check_policy(
                age_band="primary",
                consent="granted",
                connectivity="online",
                safety_signal="clear",
            )
            if not verdict.approved:
                raise PermissionError(verdict.verdict)
        """
        req = PolicyRequest(
            role=role,
            age_band=age_band,
            intent=intent,
            goal=goal,
            connectivity=connectivity,
            consent=consent,
            safety_signal=safety_signal,
            accessibility=accessibility,
        )
        verdict = self._policy.evaluate_session(req)
        self.logger.info(
            f"Policy gate [{type(self._policy).__name__}]: {verdict.verdict}",
            extra={
                "age_band": age_band,
                "consent": consent,
                "connectivity": connectivity,
                "safety_signal": safety_signal,
                "approved": verdict.approved,
            },
        )
        return verdict

    def check_safeguarding(self, signal: str) -> PolicyVerdict:
        """Evaluate a safeguarding signal via the real MeTTa policy.

        ``signal`` should be one of: clear | wellbeing |
        abuse-or-exploitation | self-harm | dangerous-activity |
        sexual-content | privacy-request
        """
        return self._policy.evaluate_safeguarding(signal)

    def check_cbc_evidence(self, completeness: str) -> PolicyVerdict:
        """Evaluate CBC evidence completeness: complete | incomplete | unknown."""
        return self._policy.evaluate_cbc_evidence(completeness)

    def check_attendance(
        self, token_status: str, consent_status: str
    ) -> PolicyVerdict:
        """Evaluate an attendance action: (token_status, consent_status)."""
        return self._policy.evaluate_attendance_action(token_status, consent_status)

    def check_assessment_finalization(self, sync_state: str) -> PolicyVerdict:
        """Evaluate assessment sync state: offline-pending-sync | synced."""
        return self._policy.evaluate_assessment_finalization(sync_state)

    def evaluate(
        self,
        telemetry: Dict[str, Any],
        context: Dict[str, Any],
        *,
        policy_verdict: Optional[PolicyVerdict] = None,
    ) -> List[Tuple[MeTTaRule, float]]:
        """Evaluate pedagogical rules against current telemetry and context.

        If ``policy_verdict`` is supplied and not approved, the method
        returns an empty list immediately — no pedagogical rules run
        for a session that failed the policy gate.

        If ``policy_verdict`` is *not* supplied the engine runs a
        ``check_policy()`` call automatically using values from ``context``
        (keys: ``age_band``, ``consent``, ``connectivity``, ``intent``,
        ``safety_signal``).

        Returns:
            List of (rule, match_score) tuples for rules that fired,
            sorted by combined score descending.
        """
        # ── Policy gate ──────────────────────────────────────────────
        if policy_verdict is None:
            policy_verdict = self.check_policy(
                age_band=context.get("age_band", "unknown"),
                consent=context.get("consent", "unknown"),
                connectivity=context.get("connectivity", "online"),
                intent=context.get("intent", "socratic-tutor"),
                safety_signal=context.get("safety_signal", "clear"),
                role=context.get("role", "student"),
            )

        if not policy_verdict.approved:
            self.logger.warning(
                f"Pedagogical evaluation blocked by policy gate: "
                f"{policy_verdict.verdict}"
            )
            return []

        # ── Pedagogical rules ────────────────────────────────────────
        fired_rules = []

        # Populate atomspace with current data
        self.atomspace = {
            "telemetry": telemetry,
            "context": context,
        }
        
        for rule in self.rules.values():
            # Check if rule is applicable to this context
            if not self._is_rule_applicable(rule, context):
                continue
            
            # Evaluate rule conditions
            match_score = self._evaluate_conditions(rule.conditions)
            
            if match_score > 0.5:  # Threshold for rule firing
                fired_rules.append((rule, match_score * rule.confidence))
                self.logger.debug(
                    f"Rule fired: {rule.rule_id}",
                    match_score=match_score,
                    confidence=rule.confidence
                )
        
        # Sort by combined score (match * confidence)
        fired_rules.sort(key=lambda x: x[1], reverse=True)
        
        return fired_rules
    
    def _is_rule_applicable(self, rule: MeTTaRule, context: Dict[str, Any]) -> bool:
        """Check if rule is applicable to current context (region, grade, etc.)."""
        metadata = rule.metadata
        
        # Check region applicability
        applicable_regions = metadata.get("applicable_regions", ["all"])
        if "all" not in applicable_regions:
            student_region = context.get("region", "unknown")
            if student_region not in applicable_regions:
                return False
        
        # Check grade applicability
        applicable_grades = metadata.get("applicable_grades", ["all"])
        if "all" not in applicable_grades:
            grade = context.get("grade", "unknown")
            if grade not in applicable_grades:
                return False
        
        return True
    
    def _evaluate_conditions(self, conditions: str) -> float:
        """Evaluate MeTTa-style conditions against atomspace.
        
        This is a simplified interpreter. In production, use actual MeTTa.
        
        Returns:
            Match score 0.0 to 1.0
        """
        # Parse conditions (simplified - real MeTTa would use proper parser)
        conditions = conditions.strip()
        
        # Handle (and ...) expressions
        if conditions.startswith("(and"):
            sub_conditions = self._extract_sub_conditions(conditions)
            scores = [self._evaluate_single_condition(c) for c in sub_conditions]
            return min(scores) if scores else 0.0
        
        # Handle (or ...) expressions
        elif conditions.startswith("(or"):
            sub_conditions = self._extract_sub_conditions(conditions)
            scores = [self._evaluate_single_condition(c) for c in sub_conditions]
            return max(scores) if scores else 0.0
        
        # Single condition
        else:
            return self._evaluate_single_condition(conditions)
    
    def _extract_sub_conditions(self, conditions: str) -> List[str]:
        """Extract sub-conditions from (and ...) or (or ...) expression."""
        # Remove outer (and or (or
        inner = conditions[conditions.index("(") + 1:conditions.rindex(")")]
        if inner.startswith("and") or inner.startswith("or"):
            inner = inner[3:].strip()
        
        # Split by top-level parentheses
        sub_conditions = []
        depth = 0
        current = ""
        
        for char in inner:
            if char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
            
            current += char
            
            if depth == 0 and current.strip():
                sub_conditions.append(current.strip())
                current = ""
        
        if current.strip():
            sub_conditions.append(current.strip())
        
        return sub_conditions
    
    def _evaluate_single_condition(self, condition: str) -> float:
        """Evaluate a single condition like (> (get-telemetry erasure_count) 3)."""
        condition = condition.strip()
        
        if not condition.startswith("("):
            return 0.0
        
        # Parse condition
        parts = condition[1:-1].split()
        
        if len(parts) < 3:
            return 0.0
        
        operator = parts[0]
        
        # Handle (get-telemetry field) or (get-context field)
        if parts[1].startswith("(get-"):
            source, field = parts[1][1:-1].split()
            source = source.replace("get-", "")
            
            if source not in self.atomspace:
                return 0.0
            
            value = self.atomspace[source].get(field)
            if value is None:
                return 0.0
        else:
            value = parts[1]
        
        # Get comparison value
        if len(parts) > 2:
            compare_to = parts[2]
            # Convert types
            if compare_to == "true":
                compare_to = True
            elif compare_to == "false":
                compare_to = False
            elif compare_to.isdigit():
                compare_to = int(compare_to)
            elif compare_to.replace(".", "").isdigit():
                compare_to = float(compare_to)
            else:
                compare_to = compare_to.strip('"')
        else:
            compare_to = None
        
        # Evaluate operator
        if operator == ">":
            return 1.0 if value > compare_to else 0.0
        elif operator == "<":
            return 1.0 if value < compare_to else 0.0
        elif operator == ">=":
            return 1.0 if value >= compare_to else 0.0
        elif operator == "<=":
            return 1.0 if value <= compare_to else 0.0
        elif operator == "=":
            return 1.0 if value == compare_to else 0.0
        elif operator == "contains":
            return 1.0 if compare_to in str(value) else 0.0
        
        return 0.0
    
    def learn_rule_from_feedback(
        self,
        decision_data: Dict[str, Any],
        teacher_feedback: str,
        teacher_comment: Optional[str] = None
    ) -> Optional[MeTTaRule]:
        """Learn a new rule from teacher feedback.
        
        This is where the magic happens - system proposes new rules
        based on patterns in teacher feedback.
        
        Args:
            decision_data: The AI decision that got feedback
            teacher_feedback: 'helpful' or 'not_helpful'
            teacher_comment: Optional teacher comment
            
        Returns:
            Proposed new rule (needs validation before activation)
        """
        
        # Only learn from helpful decisions
        if teacher_feedback != "helpful":
            return None
        
        # Extract pattern from decision
        telemetry = decision_data.get("telemetry", {})
        context = decision_data.get("context", {})
        action = decision_data.get("ai_action")
        examples_used = decision_data.get("examples_used", [])
        
        # Check if this is a cultural pattern worth encoding
        if examples_used and context.get("region"):
            region = context["region"]
            competency = context.get("competency", "GENERAL")
            
            # Propose a new cultural rule
            rule_id = f"R{len(self.rules) + 100}"
            rule_name = f"use_{examples_used[0]}_for_{region}_{competency.split('.')[-1].lower()}"
            
            conditions = f"""
            (and
              (= (get-context competency) "{competency}")
              (= (get-context student_region) "{region}"))
            """
            
            proposed_rule = MeTTaRule(
                rule_id=rule_id,
                rule_name=rule_name,
                conditions=conditions,
                action=f"use_{examples_used[0]}_examples",
                confidence=0.6,  # Start with medium confidence
                metadata={
                    "scaffolding_level": "moderate",
                    "explanation": f"Students in {region} respond well to {examples_used[0]} examples for {competency}",
                    "applicable_regions": [region],
                    "applicable_grades": [context.get("grade", "all")],
                    "examples": examples_used,
                    "learned_from": "teacher_feedback",
                    "teacher_comment": teacher_comment
                }
            )
            
            self.logger.info(
                f"Proposed new rule from feedback: {rule_name}",
                confidence=0.6
            )
            
            return proposed_rule
        
        return None
    
    def export_rules(self, output_path: Path):
        """Export all rules to JSON file for versioning."""
        rules_data = {
            rule_id: {
                "rule_name": rule.rule_name,
                "conditions": rule.conditions,
                "action": rule.action,
                "confidence": rule.confidence,
                "metadata": rule.metadata
            }
            for rule_id, rule in self.rules.items()
        }
        
        output_path.write_text(json.dumps(rules_data, indent=2))
        self.logger.info(f"Exported {len(rules_data)} rules to {output_path}")
    
    def load_rules_from_file(self, input_path: Path):
        """Load rules from JSON file."""
        rules_data = json.loads(input_path.read_text())
        
        for rule_id, data in rules_data.items():
            rule = MeTTaRule(
                rule_id=rule_id,
                rule_name=data["rule_name"],
                conditions=data["conditions"],
                action=data["action"],
                confidence=data["confidence"],
                metadata=data["metadata"]
            )
            self.add_rule(rule)
        
        self.logger.info(f"Loaded {len(rules_data)} rules from {input_path}")
    
    def import_rules_from_database(self, learned_rules: List[Dict[str, Any]]):
        """Import rules from database (learned_rules table).
        
        This syncs the MeTTa engine with rules learned from teacher feedback.
        """
        for rule_data in learned_rules:
            # Convert database format to MeTTa format
            conditions_dict = rule_data.get("conditions", {})
            
            # Build MeTTa condition expression
            condition_parts = []
            for field, condition in conditions_dict.items():
                operator = condition.get("operator", "=")
                value = condition.get("value")
                
                # Format value
                if isinstance(value, bool):
                    value_str = "true" if value else "false"
                elif isinstance(value, str):
                    value_str = f'"{value}"'
                else:
                    value_str = str(value)
                
                condition_parts.append(f"({operator} (get-telemetry {field}) {value_str})")
            
            conditions = f"(and\n  {chr(10).join(condition_parts)})" if len(condition_parts) > 1 else condition_parts[0]
            
            rule = MeTTaRule(
                rule_id=rule_data["rule_id"],
                rule_name=rule_data["rule_name"],
                conditions=conditions,
                action=rule_data["action"],
                confidence=rule_data["confidence"],
                metadata={
                    "scaffolding_level": rule_data.get("scaffolding_level"),
                    "explanation": rule_data["rule_description"],
                    "applicable_regions": rule_data.get("applicable_regions", ["all"]),
                    "applicable_grades": rule_data.get("applicable_grades", ["all"]),
                    "times_applied": rule_data.get("times_applied", 0),
                    "times_helpful": rule_data.get("times_helpful", 0),
                    "status": rule_data.get("status", "active")
                }
            )
            
            self.add_rule(rule)
        
        self.logger.info(f"Imported {len(learned_rules)} rules from database")
    
    def get_rule_explanation(self, rule_id: str) -> str:
        """Get human-readable explanation of a rule."""
        if rule_id not in self.rules:
            return "Rule not found"
        
        rule = self.rules[rule_id]
        
        explanation = f"**{rule.rule_name}** (Confidence: {rule.confidence:.0%})\n\n"
        explanation += f"{rule.metadata.get('explanation', 'No explanation available')}\n\n"
        explanation += f"**Action:** {rule.action}\n"
        explanation += f"**Scaffolding Level:** {rule.metadata.get('scaffolding_level', 'N/A')}\n"
        
        if rule.metadata.get("applicable_regions"):
            explanation += f"**Applicable Regions:** {', '.join(rule.metadata['applicable_regions'])}\n"
        
        if rule.metadata.get("examples"):
            explanation += f"**Examples Used:** {', '.join(rule.metadata['examples'])}\n"
        
        return explanation


# Singleton instance
_metta_engine: Optional[MeTTaEngine] = None


def get_metta_engine(rules_path: Optional[Path] = None) -> MeTTaEngine:
    """Get or create the MeTTa engine singleton."""
    global _metta_engine
    if _metta_engine is None:
        _metta_engine = MeTTaEngine(rules_path)
    return _metta_engine
