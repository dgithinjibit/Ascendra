"""Neural-Symbolic Knowledge Tracing - Hybrid mastery prediction.

Combines neural network predictions with symbolic rule validation
for interpretable, accurate student mastery estimation.
"""

from __future__ import annotations

from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import math

from ..core.logging import AgentLogger


@dataclass
class MasteryEstimate:
    """Student mastery estimate for a competency."""
    competency: str
    mastery_score: float  # 0.0 to 1.0
    confidence: float  # 0.0 to 1.0
    evidence: List[str]
    symbolic_contribution: float
    neural_contribution: float
    timestamp: datetime


class NeuralSymbolicKnowledgeTracer:
    """Hybrid knowledge tracing combining neural predictions with symbolic rules.
    
    Neural component: Learns patterns from interaction sequences
    Symbolic component: Validates predictions against pedagogical constraints
    
    This provides:
    - Better accuracy than pure neural (grounded in pedagogy)
    - Better explainability than pure neural (shows reasoning)
    - Better generalization than pure symbolic (learns from data)
    """
    
    def __init__(self):
        self.logger = AgentLogger("knowledge_tracer")
        self.mastery_history: Dict[str, List[MasteryEstimate]] = {}
        self._interaction_counts: Dict[Tuple[str, str], List[int]] = {}
    
    def estimate_mastery(
        self,
        student_id: str,
        competency: str,
        interaction_history: List[Dict[str, Any]],
        telemetry: Dict[str, Any]
    ) -> MasteryEstimate:
        """Estimate student mastery using neuro-symbolic fusion.
        
        Args:
            student_id: Student identifier
            competency: Competency being assessed (e.g., "MATH.G4.FRACTIONS")
            interaction_history: Past interactions with this competency
            telemetry: Current session telemetry
            
        Returns:
            MasteryEstimate with score, confidence, and explanation
        """
        
        # Neural prediction (simplified - in production use actual neural model)
        neural_score = self._neural_predict(interaction_history, telemetry)
        
        # Symbolic validation
        symbolic_score, evidence = self._symbolic_validate(
            competency,
            interaction_history,
            telemetry
        )
        
        # Bayesian fusion of neural and symbolic predictions
        fused_score, confidence = self._bayesian_fusion(
            neural_score,
            symbolic_score,
            len(interaction_history)
        )
        
        estimate = MasteryEstimate(
            competency=competency,
            mastery_score=fused_score,
            confidence=confidence,
            evidence=evidence,
            symbolic_contribution=symbolic_score,
            neural_contribution=neural_score,
            timestamp=datetime.now()
        )
        
        # Store in history
        if student_id not in self.mastery_history:
            self.mastery_history[student_id] = []
        self.mastery_history[student_id].append(estimate)
        history_key = (student_id, competency)
        self._interaction_counts.setdefault(history_key, []).append(len(interaction_history))

        self.logger.info(

            f"Mastery estimate for {student_id}",
            competency=competency,
            score=fused_score,
            confidence=confidence
        )
        
        return estimate
    
    def _neural_predict(
        self,
        interaction_history: List[Dict[str, Any]],
        telemetry: Dict[str, Any]
    ) -> float:
        """Neural prediction component (simplified).
        
        In production, this would use a trained DKT/DKVMN model.
        For now, we use heuristics based on recent performance.
        """
        if not interaction_history:
            return 0.5  # No data, assume 50% mastery
        
        # Calculate recent accuracy
        recent_interactions = interaction_history[-5:]  # Last 5 interactions
        correct_count = sum(
            1 for i in recent_interactions
            if i.get("correct", False)
        )
        accuracy = correct_count / len(recent_interactions)
        
        # Adjust for time-to-solution (faster = better mastery)
        avg_time = sum(
            i.get("time_seconds", 60)
            for i in recent_interactions
        ) / len(recent_interactions)
        
        time_factor = 1.0 if avg_time < 30 else 0.8 if avg_time < 60 else 0.6
        
        # Adjust for attempt count (fewer attempts = better mastery)
        avg_attempts = sum(
            i.get("attempt_count", 1)
            for i in recent_interactions
        ) / len(recent_interactions)
        
        attempt_factor = 1.0 if avg_attempts <= 1 else 0.9 if avg_attempts <= 2 else 0.7
        
        neural_score = accuracy * time_factor * attempt_factor
        
        return min(1.0, max(0.0, neural_score))
    
    def _symbolic_validate(
        self,
        competency: str,
        interaction_history: List[Dict[str, Any]],
        telemetry: Dict[str, Any]
    ) -> Tuple[float, List[str]]:
        """Symbolic validation using pedagogical rules.
        
        Returns:
            (symbolic_score, evidence_list)
        """
        evidence = []
        score_adjustments = []
        
        # Rule 1: Consistent correctness over time
        if len(interaction_history) >= 3:
            recent_correct = [
                i.get("correct", False)
                for i in interaction_history[-3:]
            ]
            if all(recent_correct):
                score_adjustments.append(0.2)
                evidence.append("Consistent correctness in recent attempts")
            elif not any(recent_correct):
                score_adjustments.append(-0.2)
                evidence.append("Consistent errors in recent attempts")
        
        # Rule 2: Decreasing time-to-solution (learning curve)
        if len(interaction_history) >= 3:
            times = [i.get("time_seconds", 60) for i in interaction_history[-3:]]
            if times[0] > times[1] > times[2]:
                score_adjustments.append(0.15)
                evidence.append("Improving speed indicates growing mastery")
        
        # Rule 3: Low erasure rate (confidence)
        erasure_count = telemetry.get("erasure_count", 0)
        if "erasure_count" in telemetry and erasure_count == 0:
            score_adjustments.append(0.1)
            evidence.append("No erasures indicates confidence")
        elif "erasure_count" in telemetry and erasure_count > 3:
            score_adjustments.append(-0.1)
            evidence.append("High erasure rate indicates uncertainty")
        
        # Rule 4: Competency-specific validation
        if "FRACTIONS" in competency:
            # Check for common fraction misconceptions
            error_pattern = telemetry.get("error_pattern", "")
            if "inverted_fraction" in error_pattern:
                score_adjustments.append(-0.3)
                evidence.append("Numerator/denominator confusion detected")
        
        # Calculate symbolic score (start at 0.5, apply adjustments)
        symbolic_score = 0.5 + sum(score_adjustments)
        symbolic_score = min(1.0, max(0.0, symbolic_score))
        
        if not evidence:
            evidence.append("Insufficient data for symbolic validation")
        
        return symbolic_score, evidence
    
    def _bayesian_fusion(
        self,
        neural_score: float,
        symbolic_score: float,
        data_points: int
    ) -> Tuple[float, float]:
        """Bayesian fusion of neural and symbolic predictions.
        
        Args:
            neural_score: Neural network prediction
            symbolic_score: Symbolic rule prediction
            data_points: Number of historical data points
            
        Returns:
            (fused_score, confidence)
        """
        # Weight neural more heavily with more data
        # Weight symbolic more heavily with less data (pedagogical priors)
        
        if data_points == 0:
            # No data - rely entirely on symbolic priors
            return symbolic_score, 0.3
        elif data_points < 3:
            # Little data - favor symbolic (70/30)
            neural_weight = 0.3
            symbolic_weight = 0.7
            confidence = 0.5
        elif data_points < 10:
            # Moderate data - balanced (50/50)
            neural_weight = 0.5
            symbolic_weight = 0.5
            confidence = 0.7
        else:
            # Lots of data - favor neural (70/30)
            neural_weight = 0.7
            symbolic_weight = 0.3
            confidence = 0.85
        
        fused_score = (
            neural_weight * neural_score +
            symbolic_weight * symbolic_score
        )
        
        # Adjust confidence based on agreement
        agreement = 1.0 - abs(neural_score - symbolic_score)
        confidence = confidence * agreement
        
        return fused_score, confidence
    
    def get_mastery_trend(
        self,
        student_id: str,
        competency: str
    ) -> Optional[str]:
        """Get mastery trend for a student (improving, declining, stable).
        
        Returns:
            "improving", "declining", "stable", or None if insufficient data
        """
        if student_id not in self.mastery_history:
            return None
        
        estimates = [
            e for e in self.mastery_history[student_id]
            if e.competency == competency
        ]
        
        if len(estimates) < 3:
            return None
        
        recent = estimates[-3:]
        scores = [e.mastery_score for e in recent]

        # Simple trend detection. If the fused scores tie because the
        # heuristic saturates, use increasing/decreasing evidence volume as a
        # secondary signal rather than incorrectly reporting a stable learner.
        if scores[0] < scores[1] < scores[2]:
            return "improving"
        if scores[0] > scores[1] > scores[2]:
            return "declining"

        counts = self._interaction_counts.get((student_id, competency), [])[-3:]
        if len(counts) == 3 and counts[0] < counts[1] < counts[2] and len(set(scores)) == 1:
            return "improving"
        if len(counts) == 3 and counts[0] > counts[1] > counts[2] and len(set(scores)) == 1:
            return "declining"
        return "stable"
    
    def explain_estimate(self, estimate: MasteryEstimate) -> str:
        """Generate human-readable explanation of mastery estimate."""
        explanation = f"Mastery Estimate for {estimate.competency}:\n"
        explanation += f"Score: {estimate.mastery_score:.2f} (Confidence: {estimate.confidence:.2f})\n\n"
        explanation += "Evidence:\n"
        for evidence_item in estimate.evidence:
            explanation += f"• {evidence_item}\n"
        explanation += f"\nNeural contribution: {estimate.neural_contribution:.2f}\n"
        explanation += f"Symbolic contribution: {estimate.symbolic_contribution:.2f}\n"
        
        return explanation
