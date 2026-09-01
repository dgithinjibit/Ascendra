-- ============================================================================
-- QUICK FIX: Add missing columns for training data export
-- Run this in Supabase SQL Editor if you get PGRST204 error
-- ============================================================================

-- Add storage tracking columns to schemes table
ALTER TABLE schemes 
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS exported_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS export_format TEXT DEFAULT 'json',
ADD COLUMN IF NOT EXISTS is_training_data BOOLEAN DEFAULT false;

-- Create indexes for training data queries
CREATE INDEX IF NOT EXISTS idx_schemes_training_data ON schemes(is_training_data, exported_at DESC);
CREATE INDEX IF NOT EXISTS idx_schemes_storage_path ON schemes(storage_path) WHERE storage_path IS NOT NULL;

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'schemes' 
AND column_name IN ('exported_at', 'storage_path', 'is_training_data', 'export_format')
ORDER BY column_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration applied successfully!';
  RAISE NOTICE '✅ Added columns: storage_path, exported_at, export_format, is_training_data';
  RAISE NOTICE '✅ Created indexes for performance';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test the export feature in your frontend';
  RAISE NOTICE '2. If still getting errors, refresh schema cache: NOTIFY pgrst, ''reload schema'';';
END $$;
