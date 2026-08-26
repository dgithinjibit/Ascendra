#!/usr/bin/env python3
"""Validate the synthetic Syncsenta holistic child-development dataset."""

from __future__ import annotations

import json
from pathlib import Path


REQUIRED = {
    "id",
    "age_band",
    "grade_band",
    "domain",
    "context",
    "signals",
    "support_goal",
    "recommended_response",
    "autonomy_level",
    "escalation",
    "safety_flags",
    "evidence_type",
    "pii_present",
    "source_principles",
    "learning_objective",
    "localization_notes",
    "accessibility_notes",
    "adult_support_route",
    "license",
}


def main() -> int:
    path = Path(__file__).with_name("holistic_child_development_dataset.jsonl")
    rows = [json.loads(line) for line in path.read_text().splitlines() if line.strip()]
    ids = [row.get("id") for row in rows]
    assert rows, "dataset is empty"
    assert len(ids) == len(set(ids)), "record IDs must be unique"
    for index, row in enumerate(rows, start=1):
        missing = REQUIRED - row.keys()
        assert not missing, f"row {index} missing fields: {sorted(missing)}"
        assert row["evidence_type"] == "synthetic_scenario", f"row {index} is not synthetic"
        assert row["pii_present"] is False, f"row {index} claims PII is present"
        assert isinstance(row["signals"], list) and row["signals"], f"row {index} signals invalid"
        assert isinstance(row["safety_flags"], list), f"row {index} safety_flags invalid"
    print(f"validated {len(rows)} synthetic records; unique IDs; pii_present=false")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
