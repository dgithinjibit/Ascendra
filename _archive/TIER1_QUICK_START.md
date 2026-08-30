# Tier 1 Quick Start Guide

## What's Done ✅

All Tier 1 frontend integration is complete:

1. **Structured Renderers** - WorksheetRenderer, TextLevelerRenderer, UnpackedOutcomeRenderer
2. **Print Stylesheets** - A4-formatted print-to-PDF for worksheets and text levelers
3. **Frontend Wiring** - All three generators integrated into Magic School Teacher UI
4. **Database Migration** - SQL ready to apply for `worksheets` and `unpacked_outcomes` tables

## Quick Test (No Migration Required)

You can test the UI immediately without applying migrations:

```bash
cd Ascendra/studio
npm run dev
```

Then:
1. Navigate to Magic School Teacher
2. Go to "Worksheets" tab
3. Fill in topic and click "Generate Worksheet"
4. See structured worksheet with KSA-balanced items
5. Click "Print to PDF" to test print formatting

Same for "Text Leveler" tab and "Scheme of Work" → "Unpack outcome" button.

## Apply Database Migration

To enable persistence (backend saving to database):

### Quick Method (Supabase Dashboard)
1. Go to: https://app.supabase.com/project/<your-project-ref>/sql
2. Copy contents of: `Ascendra/supabase/migrations/20260522000001_tier1_tables.sql`
3. Paste and click "Run"
4. Done!

### Verify Migration
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('worksheets', 'unpacked_outcomes');
```

Should return 2 rows.

## What Happens After Migration

- Worksheets will be saved to database with unique `worksheet_id`
- Unpacked outcomes will be saved with unique `unpacked_id`
- Backend logs will stop showing "table does not exist" errors
- Teachers can retrieve past worksheets (future feature)

## Files to Review

- **Renderers**: `studio/src/components/teacher/*-renderer.tsx`
- **Print CSS**: `studio/src/styles/print.css`
- **Migration**: `supabase/migrations/20260522000001_tier1_tables.sql`
- **Full Docs**: `TIER1_IMPLEMENTATION.md`

## Next Steps

After validating Tier 1:
- Tier 2: Differentiation, Rubrics, CAT item banks
- Tier 3: Roster + personalization tools
- Tier 4: Polish features (YouTube → lesson plan, image → activity)

## Need Help?

Check `TIER1_IMPLEMENTATION.md` for:
- Detailed testing checklist
- Verification queries
- Known limitations
- Full file list
