# MeTTa Integration: Dynamic, Evolvable Pedagogical Rules

## Overview

MeTTa (Meta Type Talk) provides a **dynamic rule storage and reasoning layer** that makes SyncSenta's pedagogical intelligence:
- **Not hardcoded** - Rules stored as data, not code
- **Evolvable** - New rules learned from teacher feedback
- **Versionable** - Export/import rules for rollback
- **Explainable** - Human-readable rule expressions

## Why MeTTa?

### The Problem with Hardcoded Rules
```python
# ❌ Hardcoded - can't change without code deployment
if erasure_count > 3 and dwell_time > 60:
    return "simplify_problem"
```

### The MeTTa Solution
```metta
; ✅ Dynamic - stored as data, can be updated from database
(= (detect-frustration $telemetry)
   (if (and (> (get-telemetry erasure_count) 3)
            (> (get-telemetry dwell_time_seconds) 60))
       simplify_problem
       continue))
```

**Benefits:**
- Rules can be added/removed without code changes
- Teachers can propose new rules through UI
- System learns rules from feedback patterns
- Rules can be A/B tested before activation
- Full audit trail of rule changes

## Architecture

```
Teacher Feedback
    ↓
Database (learned_rules table)
    ↓
Rule Sync Service (syncs every hour)
    ↓
MeTTa Engine (in-memory reasoning)
    ↓
Tutoring Agent (uses rules for decisions)
    ↓
Decision Logger (logs which rules fired)
    ↓
Teacher Feedback (closes the loop)
```

## Components

### 1. MeTTa Engine (`metta_engine.py`)
**Purpose:** Dynamic rule storage and evaluation

**Key Features:**
- Stores rules as data structures (not code)
- Evaluates rules against telemetry/context
- Supports MeTTa-style expressions
- Can load/export rules from files

**Example Usage:**
```python
from syncsenta_agents.reasoning.metta_engine import get_metta_engine

# Get engine
metta = get_metta_engine()

# Evaluate rules
fired_rules = metta.evaluate(
    telemetry={"erasure_count": 5, "dwell_time_seconds": 70},
    context={"region": "nairobi", "competency": "MATH.RATIOS"}
)

# fired_rules = [(rule, confidence_score), ...]
```

### 2. Rule Sync Service (`rule_sync_service.py`)
**Purpose:** Syncs rules between database and MeTTa engine

**Key Features:**
- Loads active rules from database on startup
- Analyzes teacher feedback to propose new rules
- Updates rule confidence based on outcomes
- Exports rule snapshots for versioning

**Example Usage:**
```python
from syncsenta_agents.reasoning.rule_sync_service import get_rule_sync_service

# Get service
rule_sync = get_rule_sync_service(supabase)

# Sync from database
await rule_sync.sync_from_database()

# Propose new rules from feedback
proposed_rules = await rule_sync.propose_rules_from_feedback(
    min_feedback_count=10,
    min_helpful_rate=0.7
)

# Save proposed rules for teacher validation
for rule in proposed_rules:
    await rule_sync.save_proposed_rule_to_database(rule)
```

### 3. Rule Learning Job (`rule_learning_job.py`)
**Purpose:** Automated rule discovery (runs daily)

**What it does:**
1. Syncs rules from database
2. Analyzes teacher feedback patterns
3. Proposes new rules (if patterns found)
4. Exports rule snapshots
5. Generates summary report

**Run manually:**
```bash
cd ai-agents
python -m syncsenta_agents.jobs.rule_learning_job
```

**Schedule with cron:**
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/ai-agents && python -m syncsenta_agents.jobs.rule_learning_job
```

## MeTTa Rule Format

### Basic Structure
```metta
(= (rule-name $telemetry $context)
   (if (conditions)
       action
       default-action))
```

### Example: Detect Frustration
```metta
(= (detect-frustration $telemetry)
   (if (and (> (get-telemetry erasure_count) 3)
            (> (get-telemetry dwell_time_seconds) 60))
       simplify_problem
       continue))
```

### Example: Cultural Context
```metta
(= (select-example $context)
   (if (and (= (get-context competency) "MATH.RATIOS")
            (= (get-context student_region) "nairobi"))
       use_matatu_fare_examples
       use_generic_examples))
```

### Metadata
Each rule has metadata:
```python
{
    "scaffolding_level": "substantial",
    "explanation": "High erasure + long dwell time indicates frustration",
    "applicable_regions": ["all"],
    "applicable_grades": ["Grade 4", "Grade 5"],
    "examples": ["matatu", "fare"],
    "learned_from": "teacher_feedback",
    "sample_size": 25,
    "success_rate": 0.85
}
```

## Rule Lifecycle

### 1. Seed Rules (Default)
System starts with 4 default rules:
- Detect frustration
- Detect flow state
- Use matatu examples (Nairobi)
- Use shamba examples (rural)

### 2. Proposed Rules (From Feedback)
After 10+ teacher feedback entries, system proposes new rules:
```
Pattern detected: "M-Pesa examples work well for urban ratios"
↓
Proposed rule: use_mpesa_for_urban_ratios
↓
Status: "proposed" (needs validation)
```

### 3. Validated Rules (Teacher Approved)
Teachers vote on proposed rules:
- Upvote: "This would help my students"
- Downvote: "This wouldn't work"

If upvotes > downvotes + threshold → Status: "validated"

### 4. Active Rules (A/B Tested)
Validated rules enter A/B testing:
- 50% of students get new rule
- 50% get existing rules (control)
- Measure success rate

If new rule performs better → Status: "active"

### 5. Deprecated Rules (Low Performance)
If rule success rate drops below 60%:
- Status: "deprecated"
- Removed from MeTTa engine
- Kept in database for audit trail

## Self-Learning Pipeline

### Daily Automated Process

**2:00 AM - Rule Learning Job Runs**
```
1. Sync rules from database
   ✓ Loaded 47 active rules

2. Analyze teacher feedback (last 7 days)
   ✓ Found 23 helpful decisions
   ✓ Detected 2 cultural patterns
   ✓ Detected 1 scaffolding pattern

3. Propose new rules
   ✓ Proposed: use_mpesa_for_urban_ratios (85% success rate)
   ✓ Proposed: use_substantial_scaffolding_when_circular_pathing (78% success rate)

4. Export snapshot
   ✓ Saved: metta_rules_20250506_020000.json

5. Generate report
   ✓ Saved: report_20250506_020000.txt
```

**8:00 AM - Teachers Review Proposals**
```
Teacher dashboard shows:
- 2 new proposed rules
- Each with explanation, sample size, success rate
- Teachers vote: upvote/downvote
```

**Weekly - A/B Testing**
```
Validated rules enter testing:
- Control group: 50% of students
- Treatment group: 50% of students (with new rule)
- Measure: helpful rate, student outcomes
- Duration: 1 week
```

**Monthly - Activation**
```
Rules that pass A/B testing:
- Status: "proposed" → "validated" → "active"
- Added to MeTTa engine
- Used for all students
```

## Example: Learning a Cultural Rule

### Week 1: Teacher Feedback
```
Decision 1: Used "matatu fare" example for Nairobi student
Teacher feedback: "Helpful! Student understood immediately"

Decision 2: Used "matatu fare" example for Nairobi student
Teacher feedback: "Helpful! Very relatable"

Decision 3: Used "matatu fare" example for Nairobi student
Teacher feedback: "Helpful! Perfect example"

... (10 more similar decisions)
```

### Week 2: Pattern Detection
```
Rule Learning Job runs:
- Detected pattern: "matatu" examples in Nairobi → 92% helpful rate
- Proposed rule: use_matatu_for_nairobi_ratios
- Saved to database with status="proposed"
```

### Week 3: Teacher Validation
```
Teachers see proposal in dashboard:
- Rule: "Use matatu fare examples for ratio problems in Nairobi"
- Evidence: 13 decisions, 92% helpful rate
- 8 teachers upvote, 1 downvotes
- Status: "proposed" → "validated"
```

### Week 4: A/B Testing
```
50% of Nairobi students get matatu examples
50% get generic examples
Results after 1 week:
- Matatu group: 88% helpful rate
- Generic group: 65% helpful rate
- Statistical significance: p < 0.01
- Decision: Activate rule
```

### Week 5: Activation
```
Rule status: "validated" → "active"
All Nairobi students now get matatu examples for ratios
Rule added to MeTTa engine permanently
```

## Migration Path: Python → MeTTa/Hyperon

### Current (Python Implementation)
```python
# Simplified MeTTa-style reasoning in Python
# Good for: 10-100 rules
# Limitations: No advanced reasoning, no rule chaining
```

### Future (Actual MeTTa/Hyperon)
```python
# When you have 100+ rules, migrate to:
from hyperon import MeTTa

metta = MeTTa()
metta.load_rules("pedagogical_rules.metta")
result = metta.query("(detect-frustration $telemetry)")
```

**Benefits of full MeTTa:**
- Rule chaining (rules can trigger other rules)
- Probabilistic reasoning
- Formal verification
- Better performance with 1000+ rules

## Versioning & Rollback

### Export Snapshot
```bash
# Manual export
python -c "
from syncsenta_agents.reasoning.rule_sync_service import get_rule_sync_service
import asyncio
from pathlib import Path

async def export():
    service = get_rule_sync_service()
    await service.export_rules_snapshot(Path('snapshots'))

asyncio.run(export())
"
```

### Rollback to Previous Version
```python
from syncsenta_agents.reasoning.metta_engine import get_metta_engine
from pathlib import Path

# Load rules from snapshot
metta = get_metta_engine()
metta.load_rules_from_file(Path("snapshots/metta_rules_20250501_020000.json"))
```

## Monitoring & Metrics

### Key Metrics
```sql
-- Rule effectiveness
SELECT 
  rule_id,
  rule_name,
  times_applied,
  times_helpful,
  (times_helpful::FLOAT / times_applied) as success_rate
FROM learned_rules
WHERE status = 'active'
ORDER BY success_rate DESC;

-- Proposed rules awaiting validation
SELECT 
  rule_name,
  confidence,
  created_at
FROM learned_rules
WHERE status = 'proposed'
ORDER BY confidence DESC;

-- Cultural patterns discovered
SELECT 
  pattern_name,
  region,
  occurrence_count,
  success_rate
FROM cultural_patterns
ORDER BY success_rate DESC;
```

### Dashboard Queries
```python
# Get rule statistics
from syncsenta_agents.reasoning.metta_engine import get_metta_engine

metta = get_metta_engine()

# Total rules
print(f"Total rules: {len(metta.rules)}")

# Rules by confidence
high_confidence = [r for r in metta.rules.values() if r.confidence > 0.8]
print(f"High confidence rules: {len(high_confidence)}")

# Cultural rules
cultural_rules = [r for r in metta.rules.values() if "cultural" in r.metadata.get("learned_from", "")]
print(f"Cultural rules: {len(cultural_rules)}")
```

## Best Practices

### 1. Start Small
- Begin with 4-6 seed rules
- Let system learn gradually
- Don't add too many rules manually

### 2. Validate with Teachers
- Never activate rules without teacher review
- Use community voting for validation
- A/B test before full activation

### 3. Monitor Performance
- Track rule success rates weekly
- Deprecate rules below 60% success rate
- Export snapshots before major changes

### 4. Version Control
- Export rules daily
- Keep 30 days of snapshots
- Document major rule changes

### 5. Cultural Sensitivity
- Let Kenyan teachers validate cultural rules
- Don't assume examples work everywhere
- Test regional variations

## Troubleshooting

### Issue: Rules not loading from database
**Solution:** Check Rule Sync Service logs
```bash
# Check if sync ran
grep "Synced.*rules from database" logs/agent.log
```

### Issue: No new rules proposed
**Possible causes:**
- Not enough feedback (need 10+ entries)
- Low success rate (need 70%+ helpful rate)
- No clear patterns detected

**Solution:** Collect more teacher feedback

### Issue: Rule confidence not updating
**Solution:** Check if rule statistics are being updated
```sql
SELECT * FROM learned_rules WHERE rule_id = 'R001';
-- Check times_applied, times_helpful
```

## Next Steps

1. **Week 1:** Run rule learning job manually, review output
2. **Week 2:** Schedule daily automated runs
3. **Month 1:** Collect 50+ teacher feedback entries
4. **Month 2:** First proposed rules from patterns
5. **Month 3:** First A/B tests
6. **Month 6:** 20+ active learned rules
7. **Year 1:** 100+ rules, consider migrating to full MeTTa/Hyperon

## Resources

- **MeTTa Language:** https://metta-lang.dev
- **OpenCog Hyperon:** https://wiki.opencog.org/w/Hyperon
- **Rule Learning Job:** `ai-agents/src/syncsenta_agents/jobs/rule_learning_job.py`
- **MeTTa Engine:** `ai-agents/src/syncsenta_agents/reasoning/metta_engine.py`

## The Vision

By 2030, SyncSenta will have:
- **1,000+ pedagogical rules** learned from Kenyan teachers
- **100% culturally relevant** examples (matatu, shamba, M-Pesa)
- **Self-improving system** that gets smarter daily
- **Exportable IP** - "Kenyan Pedagogical Knowledge Base"

**This is how you build a defensible moat against competitors.**
