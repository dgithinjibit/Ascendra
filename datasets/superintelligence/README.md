# Superintelligence signal dataset

This package contains a privacy-minimized JSONL extraction of 25 messages received from the **Superintelligence** newsletter sender during the mailbox search performed on 2026-08-26. It is intended for Syncsenta architecture planning and offline signal classification, not for reproducing or redistributing the newsletter itself.

Each record contains a stable source message identifier, UTC date, newsletter title, a sender label, a short summary, issue-item text when available, deterministic signal tags, and suggested Syncsenta relevance. Recipient addresses, message headers beyond the sender label, tracking links, promotional footer content, and raw mailbox metadata were excluded.

## Schema

| Field | Type | Description |
|---|---|---|
| `record_id` | string | Source message identifier from the authorized mailbox export |
| `date_utc` | string | Message date in ISO-8601 UTC date format |
| `title` | string | Newsletter subject/title |
| `sender` | string | Normalized sender label, always `Superintelligence` |
| `source_url` | string or null | Canonical public article URL when safely extracted |
| `summary` | string | Search/result summary with tracking and formatting noise removed |
| `issue_items` | array of strings | Issue-level headlines when present in the message body |
| `signal_tags` | array of strings | Deterministic architecture themes |
| `syncsenta_relevance` | array of strings | Non-executing design implications for Syncsenta |

## Signal vocabulary

The tags cover inference latency, agents, open models, safety and security, multimodality, infrastructure, and education relevance. The companion Rust module `rust-core/src/intelligence_signals.rs` classifies title/body text into the same vocabulary and emits typed actions such as preferring bounded cached inference, keeping agent actions policy-gated, retaining the Python fallback while evaluating local models, using modality-specific transport budgets, and treating compute/provider cost as an explicit constraint.

## Limitations

This is an extracted newsletter dataset, not an independently fact-checked corpus. Headlines and summaries reflect the source messages and may contain claims requiring verification before product, policy, or investment decisions. The extraction intentionally preserves enough context for engineering signal classification while excluding full newsletter bodies and tracking URLs.
