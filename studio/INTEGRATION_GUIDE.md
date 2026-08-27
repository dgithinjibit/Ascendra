# SyncSenta - Integration Guide

**Version:** 1.0.0  
**Date:** May 4, 2026

This guide explains how to integrate the MVP frontend components with the Rust backend.

---

## 🔌 Backend API Endpoints Needed

### Student Endpoints

#### 1. **Gamification Data**
```
GET /api/v1/students/{student_id}/gamification
```

**Response:**
```json
{
  "points": 1250,
  "level": 5,
  "streak": 12,
  "badges": [
    {
      "id": "badge-1",
      "name": "First Steps",
      "description": "Completed your first lesson",
      "icon": "star",
      "earned": true,
      "earnedAt": "2026-04-27T10:00:00Z",
      "rarity": "common"
    }
  ],
  "rank": 3,
  "totalStudents": 45,
  "pointsToNextLevel": 500,
  "currentLevelPoints": 250
}
```

**Frontend Usage:**
```typescript
// In studio/src/app/student/page.tsx
const response = await fetch(`/api/v1/students/${studentId}/gamification`);
const data = await response.json();
// Pass to <GamificationPanel data={data} />
```

---

#### 2. **Competency Map**
```
GET /api/v1/students/{student_id}/competencies
```

**Response:**
```json
{
  "subjects": [
    {
      "id": "math",
      "name": "Mathematics",
      "icon": "calculator",
      "overallMastery": 78,
      "topics": [
        {
          "id": "fractions",
          "name": "Fractions",
          "overallMastery": 85,
          "competencies": [
            {
              "id": "frac-1",
              "name": "Understanding Fractions",
              "mastery": 95,
              "status": "mastered",
              "gamesRecommended": false,
              "lastPracticed": "2026-05-02T14:30:00Z",
              "totalPractices": 12
            }
          ]
        }
      ]
    }
  ]
}
```

**Frontend Usage:**
```typescript
const response = await fetch(`/api/v1/students/${studentId}/competencies`);
const data = await response.json();
// Pass to <CompetencyMap subjects={data.subjects} />
```

---

#### 3. **Real-Time Feedback**
```
POST /api/v1/students/{student_id}/answer
```

**Request:**
```json
{
  "questionId": "q-123",
  "answer": "3/4",
  "competencyId": "frac-2"
}
```

**Response:**
```json
{
  "type": "correct",
  "message": "Excellent work! You solved this problem perfectly.",
  "points": 10,
  "streakBonus": true
}
```

**Frontend Usage:**
```typescript
// In chat component when student submits answer
const response = await fetch(`/api/v1/students/${studentId}/answer`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ questionId, answer, competencyId })
});
const feedback = await response.json();
// Pass to <RealTimeFeedback feedback={feedback} />
```

---

#### 4. **Language Preference**
```
PUT /api/v1/students/{student_id}/language
```

**Request:**
```json
{
  "language": "kiswahili"
}
```

**Response:**
```json
{
  "success": true,
  "language": "kiswahili"
}
```

**Frontend Usage:**
```typescript
const handleLanguageChange = async (language: SupportedLanguage) => {
  await fetch(`/api/v1/students/${studentId}/language`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language })
  });
};
// Pass to <LanguageSelector onLanguageChange={handleLanguageChange} />
```

---

### Teacher Endpoints

#### 5. **Generate Lesson Plan**
```
POST /api/v1/teachers/generate/lesson
```

**Request:**
```json
{
  "topic": "Fractions and Decimals",
  "grade": "Grade 5",
  "subject": "Mathematics",
  "duration": 40,
  "objectives": "Students will understand..."
}
```

**Response:**
```json
{
  "type": "lesson",
  "title": "Lesson Plan: Fractions and Decimals",
  "content": "# Lesson Plan: Fractions and Decimals\n\n...",
  "metadata": {
    "subject": "Mathematics",
    "grade": "Grade 5",
    "topic": "Fractions and Decimals",
    "duration": "40 minutes"
  },
  "generatedAt": "2026-05-04T10:00:00Z"
}
```

---

#### 6. **Generate Quiz**
```
POST /api/v1/teachers/generate/quiz
```

**Request:**
```json
{
  "topic": "Photosynthesis",
  "grade": "Grade 6",
  "subject": "Science",
  "difficulty": "Medium",
  "questions": 10
}
```

**Response:**
```json
{
  "type": "quiz",
  "title": "Quiz: Photosynthesis",
  "content": "# Quiz: Photosynthesis\n\n...",
  "metadata": {
    "subject": "Science",
    "grade": "Grade 6",
    "topic": "Photosynthesis",
    "difficulty": "Medium"
  },
  "generatedAt": "2026-05-04T10:00:00Z"
}
```

---

#### 7. **Generate Report**
```
POST /api/v1/teachers/generate/report
```

**Request:**
```json
{
  "studentId": "student-123",
  "reportType": "progress",
  "period": "term"
}
```

**Response:**
```json
{
  "type": "report",
  "title": "Progress Report - Student 123",
  "content": "# Student Progress Report\n\n...",
  "metadata": {
    "subject": "All Subjects",
    "grade": "N/A",
    "topic": "progress"
  },
  "generatedAt": "2026-05-04T10:00:00Z"
}
```

---

## 🗄️ Database Schema Updates

### 1. **Gamification Tables**

```sql
-- Student points and levels
CREATE TABLE student_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(user_id),
    points INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rank INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Badges
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    criteria JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student badges (earned)
CREATE TABLE student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(user_id),
    badge_id UUID NOT NULL REFERENCES badges(id),
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, badge_id)
);
```

---

### 2. **Competency Tracking Tables**

```sql
-- CBC Competencies
CREATE TABLE competencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    grade_level VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student competency mastery
CREATE TABLE student_competencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(user_id),
    competency_id UUID NOT NULL REFERENCES competencies(id),
    mastery_percentage INTEGER NOT NULL DEFAULT 0 CHECK (mastery_percentage >= 0 AND mastery_percentage <= 100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('not-started', 'in-progress', 'mastered')),
    games_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    last_practiced TIMESTAMPTZ,
    total_practices INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, competency_id)
);
```

---

### 3. **Generated Content Tables**

```sql
-- Teacher-generated content
CREATE TABLE generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(user_id),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('lesson', 'quiz', 'report')),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 🔧 Backend Implementation (Rust)

### 1. **Gamification Service**

Create `backend/syncsenta-backend/src/services/gamification.rs`:

```rust
use sqlx::PgPool;
use uuid::Uuid;
use anyhow::Result;

pub async fn get_student_gamification(
    db: &PgPool,
    student_id: Uuid,
) -> Result<GamificationData> {
    // Fetch points, level, streak
    let gamification = sqlx::query_as!(
        StudentGamification,
        "SELECT * FROM student_gamification WHERE student_id = $1",
        student_id
    )
    .fetch_one(db)
    .await?;

    // Fetch earned badges
    let badges = sqlx::query_as!(
        Badge,
        "SELECT b.* FROM badges b
         JOIN student_badges sb ON b.id = sb.badge_id
         WHERE sb.student_id = $1",
        student_id
    )
    .fetch_all(db)
    .await?;

    // Calculate rank
    let rank = sqlx::query_scalar!(
        "SELECT COUNT(*) + 1 FROM student_gamification
         WHERE points > (SELECT points FROM student_gamification WHERE student_id = $1)",
        student_id
    )
    .fetch_one(db)
    .await?;

    Ok(GamificationData {
        points: gamification.points,
        level: gamification.level,
        streak: gamification.streak_days,
        badges,
        rank: rank as i32,
        // ... other fields
    })
}

pub async fn award_points(
    db: &PgPool,
    student_id: Uuid,
    points: i32,
) -> Result<()> {
    sqlx::query!(
        "UPDATE student_gamification
         SET points = points + $1,
             updated_at = NOW()
         WHERE student_id = $2",
        points,
        student_id
    )
    .execute(db)
    .await?;

    // Check for level up
    check_level_up(db, student_id).await?;

    // Check for badge unlocks
    check_badge_unlocks(db, student_id).await?;

    Ok(())
}
```

---

### 2. **Competency Service**

Create `backend/syncsenta-backend/src/services/competency.rs`:

```rust
use sqlx::PgPool;
use uuid::Uuid;
use anyhow::Result;

pub async fn get_student_competencies(
    db: &PgPool,
    student_id: Uuid,
) -> Result<Vec<Subject>> {
    // Fetch all competencies with student mastery
    let competencies = sqlx::query!(
        "SELECT c.*, sc.mastery_percentage, sc.status, sc.games_recommended,
                sc.last_practiced, sc.total_practices
         FROM competencies c
         LEFT JOIN student_competencies sc ON c.id = sc.competency_id AND sc.student_id = $1
         ORDER BY c.subject, c.topic, c.name",
        student_id
    )
    .fetch_all(db)
    .await?;

    // Group by subject and topic
    let subjects = group_competencies_by_subject(competencies);

    Ok(subjects)
}

pub async fn update_competency_mastery(
    db: &PgPool,
    student_id: Uuid,
    competency_id: Uuid,
    mastery_delta: i32,
) -> Result<()> {
    sqlx::query!(
        "INSERT INTO student_competencies (student_id, competency_id, mastery_percentage, total_practices)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (student_id, competency_id)
         DO UPDATE SET
             mastery_percentage = LEAST(100, student_competencies.mastery_percentage + $3),
             total_practices = student_competencies.total_practices + 1,
             last_practiced = NOW(),
             updated_at = NOW()",
        student_id,
        competency_id,
        mastery_delta
    )
    .execute(db)
    .await?;

    // Update status based on mastery
    update_competency_status(db, student_id, competency_id).await?;

    Ok(())
}
```

---

### 3. **Content Generation Service**

Create `backend/syncsenta-backend/src/services/content_generation.rs`:

```rust
use anyhow::Result;
use serde_json::json;

pub async fn generate_lesson_plan(
    config: &AppConfig,
    request: LessonPlanRequest,
) -> Result<GeneratedContent> {
    // Call LLM (OpenAI, Groq, or local model)
    let prompt = format!(
        "Generate a CBC-aligned lesson plan for {} in {} for {}. 
         Topic: {}. Duration: {} minutes. 
         Include: objectives, materials, activities, assessment.",
        request.subject, request.grade, request.topic, request.duration
    );

    let content = call_llm(&config.llm_api_key, &prompt).await?;

    Ok(GeneratedContent {
        type_: "lesson".to_string(),
        title: format!("Lesson Plan: {}", request.topic),
        content,
        metadata: json!({
            "subject": request.subject,
            "grade": request.grade,
            "topic": request.topic,
            "duration": format!("{} minutes", request.duration)
        }),
        generated_at: chrono::Utc::now(),
    })
}

pub async fn generate_quiz(
    config: &AppConfig,
    request: QuizRequest,
) -> Result<GeneratedContent> {
    let prompt = format!(
        "Generate a {} difficulty quiz on {} for {} in {}. 
         Include {} multiple choice questions with explanations and a marking scheme.",
        request.difficulty, request.topic, request.grade, request.subject, request.questions
    );

    let content = call_llm(&config.llm_api_key, &prompt).await?;

    Ok(GeneratedContent {
        type_: "quiz".to_string(),
        title: format!("Quiz: {}", request.topic),
        content,
        metadata: json!({
            "subject": request.subject,
            "grade": request.grade,
            "topic": request.topic,
            "difficulty": request.difficulty
        }),
        generated_at: chrono::Utc::now(),
    })
}
```

---

## 🔄 Real-Time Updates (WebSocket)

### Frontend WebSocket Handler

```typescript
// In studio/src/lib/websocket.ts
export function connectWebSocket(studentId: string, onMessage: (data: any) => void) {
  const ws = new WebSocket(`${WS_URL}/api/v1/mvp/ws`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // Handle different message types
    switch (data.type) {
      case 'gamification_update':
        // Update gamification panel
        onMessage({ type: 'gamification', data: data.payload });
        break;
      
      case 'competency_update':
        // Update competency map
        onMessage({ type: 'competency', data: data.payload });
        break;
      
      case 'feedback':
        // Show real-time feedback
        onMessage({ type: 'feedback', data: data.payload });
        break;
    }
  };

  return ws;
}
```

---

## 🧪 Testing Integration

### 1. **Test Gamification Endpoint**

```bash
curl -X GET http://localhost:8080/api/v1/students/{student_id}/gamification \
  -H "Authorization: Bearer {token}"
```

### 2. **Test Competency Endpoint**

```bash
curl -X GET http://localhost:8080/api/v1/students/{student_id}/competencies \
  -H "Authorization: Bearer {token}"
```

### 3. **Test Content Generation**

```bash
curl -X POST http://localhost:8080/api/v1/teachers/generate/lesson \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Fractions",
    "grade": "Grade 5",
    "subject": "Mathematics",
    "duration": 40
  }'
```

---

## 📝 Environment Variables

Add to `.env`:

```bash
# LLM for content generation
LLM_API_KEY=your_openai_or_groq_key
LLM_MODEL=gpt-4
LLM_BASE_URL=https://api.openai.com/v1

# mem0 (already configured)
MEM0_API_KEY=your_mem0_key
MEM0_ORG_ID=your_org_id
MEM0_PROJECT_ID=your_project_id

# WebSocket
WS_PORT=8080
```

---

## 🚀 Deployment Checklist

- [ ] Database migrations run successfully
- [ ] All API endpoints return correct data
- [ ] WebSocket connection establishes
- [ ] Frontend components render without errors
- [ ] Real-time updates work
- [ ] Content generation produces valid output
- [ ] Language switching persists
- [ ] Gamification points award correctly
- [ ] Competency mastery updates
- [ ] Mobile responsive on all devices

---

## 📚 Additional Resources

- **Backend Services:** `backend/syncsenta-backend/src/services/`
- **Frontend Components:** `studio/src/components/student/`, `studio/src/components/teacher/`
- **API Documentation:** (Generate with Swagger/OpenAPI)
- **Database Schema:** `backend/syncsenta-backend/migrations/`

---

**Ready to integrate!** 🎉
