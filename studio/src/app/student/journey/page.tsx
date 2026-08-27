'use client';

/**
 * /student/journey
 *
 * Three-step wizard that funnels a student into a chat session, mirroring the
 * Kenyan CBC structure (2-6-3-3-3):
 *   Step 1: pick a Level   (Pre-Primary / Lower / Upper Primary / Junior / Senior Secondary)
 *   Step 2: pick a Grade   (the grades that fall under that level)
 *   Step 3: pick a Subject (subjects valid for that grade)
 *
 * On subject click → persist {level, grade, subject} to sessionStorage and navigate to
 *   /student/chat/[subject]?grade=...
 *
 * Persistence uses sessionStorage first and localStorage as a durable fallback,
 * so an authenticated learner keeps their selected CBC context across tabs while
 * still allowing a shared-device session to be cleared explicitly.
 *
 * Curriculum data: studio/src/data/curriculum/index.ts (getAllGrades, getSubjectsForGrade).
 * Grades present in the level mapping but not in getAllGrades() are rendered as
 * "Coming soon" — honest about coverage rather than dumping empty subject grids.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, GraduationCap, BookOpen, MessageCircle, Layers, Gamepad2 } from 'lucide-react';
import { StudentHeader } from '@/components/layout/student-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAllGrades, getSubjectsForGrade } from '@/data/curriculum';

const STORAGE_LEVEL = 'learningJourney.level';
const STORAGE_GRADE = 'learningJourney.grade';
const STORAGE_SUBJECT = 'learningJourney.subject';

type LevelId =
  | 'pre-primary'
  | 'lower-primary'
  | 'upper-primary'
  | 'junior-secondary'
  | 'senior-secondary';

interface CbcLevel {
  id: LevelId;
  label: string;
  ageRange: string;
  description: string;
  grades: string[];
}

// Source: KICD CBC structure (2-6-3-3-3). Verified against
// https://eduguide.co.ke/cbc-curriculum-in-kenya/ and
// https://www.aubsp.com/age-wise-education-system-in-kenya/.
const CBC_LEVELS: readonly CbcLevel[] = [
  {
    id: 'pre-primary',
    label: 'Pre-Primary',
    ageRange: 'Ages 4–5',
    description: 'Foundational play-based learning (PP1–PP2).',
    grades: ['PP1', 'PP2'],
  },
  {
    id: 'lower-primary',
    label: 'Lower Primary',
    ageRange: 'Ages 6–8',
    description: 'Literacy, numeracy and environmental activities.',
    grades: ['Grade 1', 'Grade 2', 'Grade 3'],
  },
  {
    id: 'upper-primary',
    label: 'Upper Primary',
    ageRange: 'Ages 9–11',
    description: 'Broader subjects building toward the KPSEA at Grade 6.',
    grades: ['Grade 4', 'Grade 5', 'Grade 6'],
  },
  {
    id: 'junior-secondary',
    label: 'Junior Secondary',
    ageRange: 'Ages 12–14',
    description: 'Wide-based curriculum that helps you discover your strengths.',
    grades: ['Grade 7', 'Grade 8', 'Grade 9'],
  },
  {
    id: 'senior-secondary',
    label: 'Senior Secondary',
    ageRange: 'Ages 15–17',
    description: 'Specialised pathways: STEM, Social Sciences, or Arts & Sports.',
    grades: ['Grade 10', 'Grade 11', 'Grade 12'],
  },
];

const LEVELS_BY_ID: Record<LevelId, CbcLevel> = CBC_LEVELS.reduce(
  (acc, lvl) => ({ ...acc, [lvl.id]: lvl }),
  {} as Record<LevelId, CbcLevel>
);

type Step = 'level' | 'grade' | 'subject';

export default function JourneyPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('level');
  const [level, setLevel] = useState<LevelId | null>(null);
  const [grade, setGrade] = useState<string | null>(null);

  // Restore previous selection so a returning student sees a sensible default
  // within the same tab session. sessionStorage clears on tab close.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedLevel = (window.sessionStorage.getItem(STORAGE_LEVEL) || window.localStorage.getItem(STORAGE_LEVEL)) as LevelId | null;
    const savedGrade = window.sessionStorage.getItem(STORAGE_GRADE) || window.localStorage.getItem(STORAGE_GRADE);
    if (savedLevel && LEVELS_BY_ID[savedLevel]) {
      setLevel(savedLevel);
      if (savedGrade && LEVELS_BY_ID[savedLevel].grades.includes(savedGrade)) {
        setGrade(savedGrade);
      }
    }
  }, []);

  const coveredGrades = useMemo(() => new Set<string>(getAllGrades()), []);

  const subjects = useMemo(
    () => (grade && coveredGrades.has(grade) ? getSubjectsForGrade(grade) : []),
    [grade, coveredGrades]
  );

  const pickLevel = (id: LevelId) => {
    setLevel(id);
    setGrade(null);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_LEVEL, id);
      window.localStorage.setItem(STORAGE_LEVEL, id);
      window.sessionStorage.removeItem(STORAGE_GRADE);
      window.localStorage.removeItem(STORAGE_GRADE);
      window.sessionStorage.removeItem(STORAGE_SUBJECT);
      window.localStorage.removeItem(STORAGE_SUBJECT);
    }
    setStep('grade');
  };

  const pickGrade = (g: string) => {
    if (!coveredGrades.has(g)) return; // "Coming soon" — no-op
    setGrade(g);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_GRADE, g);
      window.localStorage.setItem(STORAGE_GRADE, g);
    }
    router.push('/student');
  };

  const pickSubject = (subject: string) => {
    if (!grade) return;
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_SUBJECT, subject);
      window.localStorage.setItem(STORAGE_SUBJECT, subject);
    }
    router.push(
      `/student/chat/${encodeURIComponent(subject)}?grade=${encodeURIComponent(grade)}`
    );
  };

  const currentLevel = level ? LEVELS_BY_ID[level] : null;

  return (
    <div className="education-shell">
      <StudentHeader showBackButton onBack={() => router.back()} variant="catalog" />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">
              Learning Journey
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">
            {step === 'level' && 'Which level are you in?'}
            {step === 'grade' && 'Which grade are you in?'}
            {step === 'subject' && 'Choose a subject'}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {step === 'level' &&
              'Tell syncsenta your school level so the conversation matches your CBC syllabus.'}
            {step === 'grade' && currentLevel &&
              `${currentLevel.label} — ${currentLevel.description}`}
            {step === 'subject' && grade &&
              `You're in ${grade}. Pick the subject you'd like to explore today.`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 md:gap-3 mb-8 text-sm flex-wrap">
          <Badge
            variant={step === 'level' ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => setStep('level')}
          >
            1. Level{currentLevel ? ` · ${currentLevel.label}` : ''}
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge
            variant={step === 'grade' ? 'default' : 'secondary'}
            className={level ? 'cursor-pointer' : 'opacity-50'}
            onClick={() => level && setStep('grade')}
          >
            2. Grade{grade ? ` · ${grade}` : ''}
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge
            variant={step === 'subject' ? 'default' : 'secondary'}
            className={grade && coveredGrades.has(grade) ? 'cursor-pointer' : 'opacity-50'}
            onClick={() => grade && coveredGrades.has(grade) && setStep('subject')}
          >
            3. Subject
          </Badge>
        </div>

        {step === 'level' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CBC_LEVELS.map((lvl) => {
              const anyCovered = lvl.grades.some((g) => coveredGrades.has(g));
              return (
                <Card
                  key={lvl.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => pickLevel(lvl.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') pickLevel(lvl.id);
                  }}
                  className="cursor-pointer transition hover:border-primary hover:shadow-md"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Layers className="h-5 w-5 text-primary" />
                      {lvl.label}
                      {!anyCovered && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          Coming soon
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{lvl.ageRange}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{lvl.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {step === 'grade' && currentLevel && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentLevel.grades.map((g) => {
                const covered = coveredGrades.has(g);
                return (
                  <Card
                    key={g}
                    role="button"
                    tabIndex={covered ? 0 : -1}
                    aria-disabled={!covered}
                    onClick={() => pickGrade(g)}
                    onKeyDown={(e) => {
                      if (covered && (e.key === 'Enter' || e.key === ' ')) pickGrade(g);
                    }}
                    className={
                      covered
                        ? 'cursor-pointer transition hover:border-primary hover:shadow-md'
                        : 'cursor-not-allowed opacity-60'
                    }
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        {g}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {covered ? (
                        <p className="text-sm text-muted-foreground">
                          CBC level · {currentLevel.label}
                        </p>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Coming soon
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                variant="ghost"
                onClick={() => setStep('level')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Change level
              </Button>
            </div>
          </>
        )}

        {step === 'subject' && grade && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {subjects.map((subject) => (
                <Card
                  key={subject}
                  role="button"
                  tabIndex={0}
                  onClick={() => pickSubject(subject)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') pickSubject(subject);
                  }}
                  className="cursor-pointer transition hover:border-primary hover:shadow-md group"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {subject}
                    </CardTitle>
                    <CardDescription>{grade}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Start chatting
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Sandbox Link */}
            <div className="mt-6">
              <Card className="border-2 border-dashed border-teal-300 bg-[#f1faf7]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Gamepad2 className="h-6 w-6 text-primary" />
                    Interactive Learning Sandbox
                  </CardTitle>
                  <CardDescription>
                    Practice with hands-on activities and games for {grade}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => {
                      if (grade) {
                        // Get first available subject for this grade
                        const firstSubject = subjects[0];
                        if (firstSubject) {
                          router.push(`/student/sandbox/${grade}/${encodeURIComponent(firstSubject.toLowerCase().replace(/\s+/g, '-'))}`);
                        } else {
                          router.push('/student/sandbox');
                        }
                      }
                    }}
                    className="w-full"
                  >
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    Enter Sandbox
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                variant="ghost"
                onClick={() => setStep('grade')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Change grade
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
