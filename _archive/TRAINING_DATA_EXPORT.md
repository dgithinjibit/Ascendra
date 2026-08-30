# Training Data Export System

## Overview

This system exports generated schemes of work, worksheets, and lesson plans to Supabase Storage for use as training data in RAG (Retrieval-Augmented Generation) models.

## Architecture

```
┌─────────────────┐
│  Frontend UI    │
│  (Export Button)│
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Backend API            │
│  /training-export/*     │
└────────┬────────────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌──────────────┐   ┌────────────────┐
│  PostgreSQL  │   │ Supabase       │
│  (metadata)  │   │ Storage        │
│              │   │ (JSON files)   │
└──────────────┘   └────────────────┘
```

## Database Schema

### New Columns in `schemes` Table
- `storage_path` (TEXT) - Path to exported file in storage
- `exported_at` (TIMESTAMP) - When scheme was last exported
- `export_format` (TEXT) - Format of export (default: 'json')
- `is_training_data` (BOOLEAN) - Flag for exported schemes

### New Table: `training_exports`
Tracks batch exports for audit and retrieval:
- `export_id` - Unique identifier
- `export_type` - Type: schemes, worksheets, lesson_plans, full
- `storage_path` - Path in Supabase Storage
- `scheme_count`, `worksheet_count`, `lesson_plan_count` - Counts
- `file_size_bytes` - Size of exported file
- `status` - pending, processing, completed, failed
- `created_by` - Teacher ID who initiated export

## API Endpoints

### 1. Export Single Scheme
```http
POST /training-export/export-scheme
Content-Type: application/json

{
  "scheme_id": "scheme_abc123",
  "teacher_id": "teacher_001",
  "include_metadata": true
}
```

**Response:**
```json
{
  "success": true,
  "export_id": "scheme_abc123",
  "storage_path": "schemes/grade-4-mathematics-term-1-abc123-20260522-143022.json",
  "items_exported": 1,
  "file_size_bytes": 15420,
  "message": "Scheme exported successfully"
}
```

### 2. Batch Export
```http
POST /training-export/batch-export
Content-Type: application/json

{
  "teacher_id": "teacher_001",
  "export_type": "schemes",
  "grade_filter": "Grade 4",
  "subject_filter": "Mathematics",
  "term_filter": null,
  "limit": 100
}
```

**Response:**
```json
{
  "success": true,
  "export_id": "batch_20260522_143022",
  "storage_path": "batches/grade-4-mathematics-all_batch_20260522_143022.json",
  "items_exported": 45,
  "file_size_bytes": 682400,
  "message": "Batch export completed: 45 schemes exported"
}
```

### 3. Get Export Statistics
```http
GET /training-export/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_schemes": 150,
    "exported_schemes": 45,
    "total_worksheets": 230,
    "total_lesson_plans": 180,
    "total_exports": 12,
    "last_export_date": "2026-05-22T14:30:22Z"
  }
}
```

### 4. Get Exportable Schemes
```http
GET /training-export/exportable-schemes
```

Returns schemes that haven't been exported or have been updated since last export.

## Supabase Storage Structure

```
training-data/ (bucket)
├── schemes/
│   ├── grade-1-mathematics-term-1-{id}-{timestamp}.json
│   ├── grade-2-science-term-2-{id}-{timestamp}.json
│   └── ...
├── worksheets/
│   └── (future)
├── lesson-plans/
│   └── (future)
└── batches/
    ├── grade-4-mathematics-all_batch_20260522_143022.json
    ├── all-all-term-1_batch_20260522_150000.json
    └── ...
```

## Exported JSON Format

### Single Scheme Export
```json
{
  "scheme_id": "scheme_abc123",
  "title": "Grade 4 Mathematics Term 1 Scheme",
  "grade": "Grade 4",
  "subject": "Mathematics",
  "term": "Term 1",
  "mode": "standard",
  "language": "english",
  "total_weeks": 13,
  "lessons_per_week": 5,
  "rows": [
    {
      "week": 1,
      "lesson": 1,
      "strand": "Numbers",
      "subStrand": "Whole Numbers",
      "specificLearningOutcome": "By the end of the lesson, the learner should be able to...",
      "learningExperiences": "...",
      "keyInquiryQuestion": "...",
      "learningResources": "...",
      "assessmentMethods": "...",
      "reflection": "..."
    }
  ],
  "created_at": "2026-05-22T10:00:00Z",
  "metadata": {
    "teacher_id": "teacher_001",
    "exported_at": "2026-05-22T14:30:22Z",
    "exported_by": "teacher_001",
    "export_version": "1.0"
  }
}
```

### Batch Export Format
```json
{
  "export_type": "schemes",
  "exported_at": "2026-05-22T14:30:22Z",
  "exported_by": "teacher_001",
  "filters": {
    "grade": "Grade 4",
    "subject": "Mathematics",
    "term": null
  },
  "total_schemes": 45,
  "schemes": [
    { /* scheme 1 */ },
    { /* scheme 2 */ },
    ...
  ]
}
```

## Setup Instructions

### 1. Apply Database Migration
```bash
# Via Supabase Dashboard
# Go to: https://app.supabase.com/project/<your-project-ref>/sql
# Copy and run: supabase/migrations/20260522000002_training_data_export.sql
```

### 2. Create Supabase Storage Bucket
```bash
# Via Supabase Dashboard
# Go to: Storage → Create bucket
# Name: training-data
# Public: No (private bucket)
# File size limit: 50MB
# Allowed MIME types: application/json
```

### 3. Set Environment Variables
```bash
# In ai-agents/.env
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

### 4. Test the API
```bash
# Start backend
cd ai-agents
python -m syncsenta_agents.api.server

# Test export endpoint
curl -X POST http://localhost:8000/training-export/export-scheme \
  -H "Content-Type: application/json" \
  -d '{"scheme_id": "scheme_abc123", "teacher_id": "teacher_001"}'
```

## Usage in RAG Pipeline

### 1. Download Training Data
```python
from supabase import create_client
import json

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# List all training data files
files = supabase.storage.from_('training-data').list('schemes/')

# Download a specific file
file_data = supabase.storage.from_('training-data').download('schemes/grade-4-mathematics-term-1-abc123.json')
scheme = json.loads(file_data)
```

### 2. Process for RAG Ingestion
```python
# Extract text chunks for embedding
def extract_chunks(scheme):
    chunks = []
    for row in scheme['rows']:
        chunk = {
            'text': f"{row['strand']} - {row['subStrand']}: {row['specificLearningOutcome']}",
            'metadata': {
                'grade': scheme['grade'],
                'subject': scheme['subject'],
                'term': scheme['term'],
                'week': row['week'],
                'lesson': row['lesson'],
            }
        }
        chunks.append(chunk)
    return chunks
```

### 3. Embed and Store in Vector DB
```python
from openai import OpenAI

client = OpenAI()

for chunk in chunks:
    embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=chunk['text']
    )
    
    # Store in your vector DB (Pinecone, Weaviate, etc.)
    vector_db.upsert(
        id=f"{chunk['metadata']['grade']}_{chunk['metadata']['week']}_{chunk['metadata']['lesson']}",
        vector=embedding.data[0].embedding,
        metadata=chunk['metadata']
    )
```

## Security Considerations

1. **Private Bucket** - training-data bucket is private by default
2. **Service Key** - Use service role key for backend operations only
3. **RLS Policies** - Can add Row Level Security if needed
4. **Teacher Attribution** - All exports track which teacher created them
5. **Audit Trail** - training_exports table provides full audit log

## Future Enhancements

- [ ] Export worksheets and lesson plans
- [ ] Automatic periodic exports (cron job)
- [ ] Export to multiple formats (JSON, CSV, Parquet)
- [ ] Compression for large batches (gzip)
- [ ] Direct integration with vector databases
- [ ] Export versioning and diff tracking
- [ ] Public dataset option for research

## Troubleshooting

### Error: "Bucket does not exist"
- Create the `training-data` bucket in Supabase Dashboard → Storage

### Error: "Permission denied"
- Ensure SUPABASE_SERVICE_KEY is set (not anon key)
- Check bucket permissions in Supabase Dashboard

### Error: "File already exists"
- Exports include timestamp to avoid collisions
- If needed, delete old file first or use unique scheme_id

### Large File Uploads Failing
- Check Supabase Storage limits (default 50MB per file)
- For large batches, split into multiple exports

## Cost Estimation

Supabase Storage pricing (as of 2026):
- Storage: $0.021/GB/month
- Bandwidth: $0.09/GB

Example costs:
- 1000 schemes @ 15KB each = 15MB = $0.0003/month storage
- 100 downloads/month = 1.5GB = $0.135/month bandwidth

**Total estimated cost: ~$0.14/month for 1000 schemes**

Much cheaper than S3 for this scale!

## Support

For issues:
1. Check Supabase Dashboard → Storage for uploaded files
2. Check `training_exports` table for export status
3. Review backend logs for detailed error messages
4. Verify environment variables are set correctly
