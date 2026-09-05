-- ─────────────────────────────────────────────────────────────────────────────
-- Omega Learning Signals
-- Adds real-time hint and frustration tracking to learning_progress so the
-- Omega tutoring decision engine has live data instead of zeros.
--
-- hints_used        — how many times this student requested a hint on this
--                     competency in the current session window
-- consecutive_wrong — streak of consecutive incorrect/unanswered turns;
--                     resets to 0 on any correct answer
--
-- Both reset to 0 when a new chat session starts (handled in app layer).
-- Both are used by buildLearningState() → evaluateTutoringDecision().
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE learning_progress
  ADD COLUMN IF NOT EXISTS hints_used        SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consecutive_wrong SMALLINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN learning_progress.hints_used IS
  'Number of hint requests by this student on this competency in the current session. '
  'Drives the hintsUsed >= 2 → Intensive branch in evaluateTutoringDecision().';

COMMENT ON COLUMN learning_progress.consecutive_wrong IS
  'Streak of consecutive turns with no correct answer. '
  'Used as frustrationSignal proxy when streak >= 3.';

-- Index for the Omega query (single-row lookup by user + subject + grade)
-- The existing PK / unique constraint on (user_id, competency_code) covers
-- the common case; this covers the broader subject+grade fallback.
CREATE INDEX IF NOT EXISTS idx_learning_progress_omega
  ON learning_progress (user_id, subject, grade, last_practiced_at DESC);
