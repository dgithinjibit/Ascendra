"""Neuro-Symbolic Reasoning Engine for Pedagogical Intelligence.

Combines neural LLM predictions with symbolic rule-based reasoning
for explainable, trustworthy adaptive learning.

Policy enforcement layer
------------------------
``HyperonPolicyEvaluator`` runs the real Hyperon MeTTa runtime against
``metta-logic/syncsenta_policy.metta``.  ``get_policy_evaluator()``
returns it when the ``hyperon`` package is installed, or transparently
falls back to ``FallbackPolicyEvaluator`` (a pure-Python mirror of every
rule in the .metta file) when it is not.

Pedagogical reasoning layer
----------------------------
``PedagogicalRuleEngine``, ``NeuralSymbolicKnowledgeTracer``, and
``MisconceptionDetector`` analyse telemetry *after* the policy gate
has approved the session.  ``MeTTaEngine`` wraps both layers.
"""

from .pedagogical_rules import PedagogicalRuleEngine
from .knowledge_tracer import NeuralSymbolicKnowledgeTracer
from .misconception_detector import MisconceptionDetector
from .hyperon_evaluator import (
    get_policy_evaluator,
    HyperonPolicyEvaluator,
    FallbackPolicyEvaluator,
    PolicyRequest,
    PolicyVerdict,
)
from .metta_engine import MeTTaEngine, MeTTaRule, get_metta_engine

__all__ = [
    # Pedagogical layer
    "PedagogicalRuleEngine",
    "NeuralSymbolicKnowledgeTracer",
    "MisconceptionDetector",
    # Policy layer
    "get_policy_evaluator",
    "HyperonPolicyEvaluator",
    "FallbackPolicyEvaluator",
    "PolicyRequest",
    "PolicyVerdict",
    # Combined engine
    "MeTTaEngine",
    "MeTTaRule",
    "get_metta_engine",
]
