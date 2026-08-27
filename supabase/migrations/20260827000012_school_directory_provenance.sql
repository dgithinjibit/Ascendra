-- Provenance fields for public school-directory candidates.
-- Imported records remain inactive until a trusted operator verifies them.
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS source_dataset TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_record_id TEXT,
  ADD COLUMN IF NOT EXISTS source_record_date DATE,
  ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS uq_schools_source_record
  ON public.schools(source_dataset, source_record_id)
  WHERE source_dataset IS NOT NULL AND source_record_id IS NOT NULL;

COMMENT ON COLUMN public.schools.source_dataset IS 'Public source identifier; never learner data.';
COMMENT ON COLUMN public.schools.source_url IS 'Attribution URL for the directory record.';
COMMENT ON COLUMN public.schools.source_record_id IS 'Stable identifier from the source dataset.';
COMMENT ON COLUMN public.schools.source_record_date IS 'Date or vintage of the source record.';
COMMENT ON COLUMN public.schools.imported_at IS 'Timestamp when SyncSenta imported the source record.';
