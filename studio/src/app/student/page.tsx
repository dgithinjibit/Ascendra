'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  MessageCircle,
  Calendar,
  Clock,
  Users,
  Brain,
  Zap,
  ArrowRight,
  Star,
  TrendingUp,
  Heart,
  Target,
  Trophy,
  Map,
  Sparkles,
} from 'lucide-react';
import { StudentHeader } from '@/components/layout/student-header';
import { GamificationPanel } from '@/components/student/gamification-panel';
import { GamificationOverview } from '@/components/gamification/gamification-overview';
import { LeaderboardPanel } from '@/components/gamification/leaderboard-panel';
import { tutorTaglineFor } from '@/lib/grade-greetings';
import type { GamificationMode } from '@/components/student/gamification-panel';
import {
  GamificationModeSwitcher,
  loadGamificationMode,
} from '@/components/student/gamification-mode-switcher';
import { getDemoBadges } from '@/lib/gamification/badges';
import { getStudentId } from '@/lib/auth/student-id';
import { CompetencyMap } from '@/components/student/competency-map';
import { FloatingConceptChat } from '@/components/student/floating-concept-chat';
import { GuardianLinkCodeCard } from '@/components/student/guardian-link-code-card';

interface StudentProfile {
  id: string;
  name: string;
  grade: string;
  preferredLanguage: 'english' | 'kiswahili' | 'mixed';
  learningStyle: string;
  interests: string[];
  strengths: string[];
  challenges: string[];
  culturalContext: {
    region: string;
    culturalReferences: string[];
  };
}

interface LearningProgress {
  subject: string;
  overallProgress: number;
  streakDays: number;
  totalSessions: number;
  averageSessionTime: number;
}

const assignments = [
  {
    id: 1,
    title: 'Mathematics — Algebra Practice',
    due: 'Tomorrow, 11:59 PM',
    status: { label: 'Urgent', variant: 'destructive' as const },
  },
  {
    id: 2,
    title: 'English — Essay Writing',
    due: 'Friday, 11:59 PM',
    status: { label: 'In Progress', variant: 'secondary' as const },
  },
  {
    id: 3,
    title: 'Science — Lab Report',
    due: 'Next Monday, 11:59 PM',
    status: { label: 'Not Started', variant: 'outline' as const },
  },
];

const learningPath = [
  { subject: 'Mathematics', progress: 85, current: 'Fractions', next: 'Ratios' },
  { subject: 'English', progress: 72, current: 'Essay Writing', next: 'Comprehension' },
  { subject: 'Science', progress: 68, current: 'Lab Methods', next: 'Observation' },
];

const todaysClasses = [
  { subject: 'Mathematics', time: '2:00 PM — 3:00 PM' },
  { subject: 'English Literature', time: '3:30 PM — 4:30 PM' },
];

const DASHBOARD_CARD_CLASS = 'border-teal-100 bg-white/90 text-slate-900 shadow-sm';

export default function StudentDashboardPage() {
  const router = useRouter();
  const [studentName, setStudentName] = useState('Student');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'gamification' | 'competency'>('overview');
  const [gamificationMode, setGamificationMode] = useState<GamificationMode>('balanced');

  useEffect(() => {
    const stored = localStorage.getItem('userName') || localStorage.getItem('studentName');
    if (stored) setStudentName(stored.split(' ')[0]);

    setGamificationMode(loadGamificationMode());

    // Check if this is student0 (demo/test student) - auto-set to Grade 2
    const studentId = getStudentId();
    if (studentId === 'student0') {
      // Auto-set Grade 2 for student0
      sessionStorage.setItem('learningJourney.grade', 'Grade 2');
      sessionStorage.setItem('learningJourney.level', 'lower-primary');
    }

    // Restore the authenticated learner's durable CBC context. Session storage
    // wins for the current tab; local storage preserves the selected context
    // across tabs and reloads until the learner explicitly changes it.
    const savedGrade = sessionStorage.getItem('learningJourney.grade') || localStorage.getItem('learningJourney.grade');
    const savedLevel = sessionStorage.getItem('learningJourney.level') || localStorage.getItem('learningJourney.level');
    if (savedGrade && !sessionStorage.getItem('learningJourney.grade')) sessionStorage.setItem('learningJourney.grade', savedGrade);
    if (savedLevel && !sessionStorage.getItem('learningJourney.level')) sessionStorage.setItem('learningJourney.level', savedLevel);
    if (!savedGrade) {
      router.push('/student/journey');
      return;
    }

    // Load personalized learning data
    loadPersonalizedLearningData();
  }, [router]);

  const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 8000) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const loadPersonalizedLearningData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      
      // Get student profile
      const profileResponse = await fetchWithTimeout('/api/test-personalization?action=profile&userId=user1');
      if (!profileResponse.ok) throw new Error('profile request failed');
      const profileData = await profileResponse.json();
      
      if (!profileData.success || !profileData.profile) {
        throw new Error('profile unavailable');
      }
      setProfile(profileData.profile);
      setStudentName(profileData.profile.name);

      // Get learning progress for main subjects
      const subjects = ['Mathematics', 'English', 'Science'];
      const progressPromises = subjects.map(async (subject) => {
        const response = await fetchWithTimeout(`/api/test-personalization?action=progress&userId=user1&subject=${subject}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.success && data.progress ? { subject, ...data.progress } : null;
      });

      const progressResults = await Promise.all(progressPromises);
      setLearningProgress(progressResults.filter(Boolean) as LearningProgress[]);
      
    } catch (error) {
      const reason = error instanceof DOMException && error.name === 'AbortError' ? 'The learning service took too long to respond.' : 'The learning service is temporarily unavailable.';
      console.error('Failed to load personalized data:', { reason, error });
      setLoadError('We could not load your learning path right now. Your progress is safe.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToTutor = (subject?: string) => {
    const target = subject
      ? `/student/tutor-dashboard?subject=${encodeURIComponent(subject)}`
      : '/student/tutor-dashboard';
    router.push(target);
  };

  const goToChat = (subject: string) => {
    const savedGrade = sessionStorage.getItem('learningJourney.grade') || localStorage.getItem('learningJourney.grade');
    if (!savedGrade) {
      router.push('/student/journey');
      return;
    }

    // Save subject durably and go directly to chat
    sessionStorage.setItem('learningJourney.subject', subject);
    localStorage.setItem('learningJourney.subject', subject);
    router.push(`/student/chat/${encodeURIComponent(subject)}?grade=${encodeURIComponent(savedGrade)}`);
  };

  const getPersonalizedGreeting = () => {
    if (!profile) return `Karibu, ${studentName}`;
    
    const greetings = {
      english: `Welcome back, ${profile.name}!`,
      kiswahili: `Karibu tena, ${profile.name}!`,
      mixed: `Karibu, ${profile.name}!`
    };
    
    return greetings[profile.preferredLanguage] || greetings.mixed;
  };

  const getPersonalizedMotivation = () => {
    if (!profile) return "Ready to learn with mwalimu_ai today?";
    
    const totalSessions = learningProgress.reduce((sum, p) => sum + p.totalSessions, 0);
    const maxStreak = Math.max(...learningProgress.map(p => p.streakDays), 0);
    
    if (maxStreak > 7) {
      return `Amazing ${maxStreak}-day streak! You're on fire! 🔥`;
    } else if (totalSessions > 10) {
      return `${totalSessions} learning sessions completed! Keep growing! 🌱`;
    } else if (profile.interests.length > 0) {
      return `Ready to explore ${profile.interests[0]} and more today?`;
    }
    
    return "Let's discover something amazing together today!";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fffaf0] text-slate-900">
        <StudentHeader showBackButton={false} onBack={() => router.back()} />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="w-full max-w-md text-center">
            <Brain className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" aria-hidden="true" />
            <p className="font-medium">Preparing your learning path</p>
            <p className="mt-2 text-sm text-muted-foreground">We are checking your grade, progress, and saved preferences.</p>
          </div>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fffaf0] text-slate-900">
        <StudentHeader showBackButton={false} onBack={() => router.back()} />
        <main className="flex flex-1 items-center justify-center p-6">
          <section className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm" role="alert">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700"><Clock className="h-6 w-6" aria-hidden="true" /></div>
            <h1 className="mt-4 text-xl font-bold">Your learning path is temporarily unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{loadError}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"><Button onClick={() => void loadPersonalizedLearningData()}>Try again</Button><Button variant="outline" onClick={() => router.push('/student/journey')}>Review my setup</Button></div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fffaf0] text-slate-900">
      <StudentHeader showBackButton={false} onBack={() => router.back()} variant="catalog" />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-headline">
                {getPersonalizedGreeting()}
              </h1>
              <p className="text-muted-foreground">
                {getPersonalizedMotivation()}
              </p>
              {profile && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="gap-1 border-teal-100 bg-teal-50 text-teal-800">
                    <Heart className="h-3 w-3" />
                    {profile.learningStyle} learner
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-teal-200 text-teal-800">
                    <Target className="h-3 w-3" />
                    {profile.grade}
                  </Badge>
                  {profile.interests.slice(0, 2).map((interest) => (
                    <Badge key={interest} variant="outline" className="gap-1 border-teal-200 text-teal-800">
                      <Star className="h-3 w-3" />
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 border-teal-200 text-teal-800">
                <Brain className="h-3 w-3" />
                Mwalimu AI ready
              </Badge>
              <Badge variant="outline" className="gap-1 border-teal-200 text-teal-800">
                <Clock className="h-3 w-3" />
                Based on your progress
              </Badge>
            </div>
          </div>

          <section className="overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-amber-50 p-4 md:p-6" aria-label="Your learning guide">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Your next step</p>
                <h2 className="mt-1 text-xl md:text-2xl font-bold">Ask Mwalimu AI, practise a strand, or check in privately.</h2>
                <p className="mt-2 text-sm text-slate-600">Your guide uses your selected grade, subject, language, and learning progress. You choose what wellbeing information to share.</p>
                <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => goToChat(learningProgress[0]?.subject || 'Mathematics')} className="gap-2"><Brain className="h-4 w-4" />Start learning</Button><Button variant="outline" onClick={() => setActiveTab('competency')} className="gap-2"><Map className="h-4 w-4" />View learning map</Button></div>
              </div>
              <img src="/images/learning-catalog/ai.png" alt="Illustration for Mwalimu AI learning support" className="h-28 w-28 object-contain self-center md:h-36 md:w-36" />
            </div>
          </section>

          <GuardianLinkCodeCard />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className={DASHBOARD_CARD_CLASS}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning Sessions</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {learningProgress.reduce((sum, p) => sum + p.totalSessions, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg {Math.round(learningProgress.reduce((sum, p) => sum + p.averageSessionTime, 0) / Math.max(learningProgress.length, 1))} min/session
                </p>
              </CardContent>
            </Card>

            <Card className={DASHBOARD_CARD_CLASS}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.max(...learningProgress.map(p => p.streakDays), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.max(...learningProgress.map(p => p.streakDays), 0) > 0 ? 'days in a row!' : 'Start your streak today!'}
                </p>
              </CardContent>
            </Card>

            <Card className={DASHBOARD_CARD_CLASS}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(learningProgress.reduce((sum, p) => sum + p.overallProgress, 0) / Math.max(learningProgress.length, 1))}%
                </div>
                <p className="text-xs text-muted-foreground">Across all subjects</p>
              </CardContent>
            </Card>

            <Card className={DASHBOARD_CARD_CLASS}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">2 due this week</p>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'outline'}
              onClick={() => setActiveTab('overview')}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'gamification' ? 'default' : 'outline'}
              onClick={() => setActiveTab('gamification')}
              className="gap-2"
            >
              <Trophy className="h-4 w-4" />
              Achievements
            </Button>
            <Button
              variant={activeTab === 'competency' ? 'default' : 'outline'}
              onClick={() => setActiveTab('competency')}
              className="gap-2"
            >
              <Map className="h-4 w-4" />
              Learning Map
            </Button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className={`${DASHBOARD_CARD_CLASS} lg:col-span-2`}>
              <CardHeader>
                <CardTitle>Your personalized learning path</CardTitle>
                <CardDescription>AI-adapted curriculum based on your progress and interests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {learningProgress.length > 0 ? (
                  learningProgress.map((progress) => (
                    <button
                      key={progress.subject}
                      onClick={() => goToChat(progress.subject)}
                      className="w-full text-left rounded-lg p-4 border hover:bg-muted transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{progress.subject}</h4>
                          <p className="text-sm text-muted-foreground">
                            {progress.totalSessions} sessions • {progress.streakDays} day streak
                          </p>
                        </div>
                        <Badge variant={progress.overallProgress > 70 ? 'default' : 'secondary'}>
                          {progress.overallProgress}%
                        </Badge>
                      </div>
                      <Progress value={progress.overallProgress} className="mb-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {progress.overallProgress < 30 ? 'Building foundations' :
                           progress.overallProgress < 70 ? 'Making good progress' :
                           'Mastering concepts'}
                        </span>
                        <span className="flex items-center gap-1">
                          Click to start learning
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  assignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{a.title}</h4>
                        <p className="text-sm text-muted-foreground">Due: {a.due}</p>
                      </div>
                      <Badge variant={a.status.variant}>{a.status.label}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className={DASHBOARD_CARD_CLASS}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Learning Path
                  </CardTitle>
                  <CardDescription>AI-personalized curriculum</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {learningPath.map((p) => (
                    <button
                      key={p.subject}
                      onClick={() => goToChat(p.subject)}
                      className="w-full text-left rounded-lg p-2 -mx-2 hover:bg-muted transition-colors"
                    >
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">{p.subject}</span>
                        <span>{p.progress}%</span>
                      </div>
                      <Progress value={p.progress} />
                      <p className="text-xs text-muted-foreground mt-1">
                        Current: {p.current} → Next: {p.next}
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className={DASHBOARD_CARD_CLASS}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    mwalimu_ai Tutor
                  </CardTitle>
                  <CardDescription>
                    {tutorTaglineFor(profile?.grade)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => {
                      const savedSubject = localStorage.getItem('learningJourney.subject') || sessionStorage.getItem('learningJourney.subject');
                      if (savedSubject) goToChat(savedSubject);
                      else router.push('/student/journey');
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Start Chat Session
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const savedSubject = localStorage.getItem('learningJourney.subject') || sessionStorage.getItem('learningJourney.subject');
                      if (savedSubject) goToChat(savedSubject);
                      else router.push('/student/journey');
                    }}
                  >
                    Learning Journey
                  </Button>
                </CardContent>
              </Card>

              <Card className={`${DASHBOARD_CARD_CLASS} border-primary/40`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Practice Sandbox
                  </CardTitle>
                  <CardDescription>
                    Drag, build, and explore. mwalimu_ai learns from how you think.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => router.push('/student/sandbox')}
                  >
                    Open Sandbox
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className={DASHBOARD_CARD_CLASS}>
                <CardHeader>
                  <CardTitle>Today&apos;s Classes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todaysClasses.map((c) => (
                    <div key={c.subject} className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{c.subject}</p>
                        <p className="text-sm text-muted-foreground">{c.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
          )}

          {/* Gamification Tab */}
          {activeTab === 'gamification' && (
          <div className="space-y-6">
            <GamificationOverview
              userId={getStudentId()}
              userName={studentName}
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <LeaderboardPanel
                userId={getStudentId()}
                scope="class"
              />
              <LeaderboardPanel
                userId={getStudentId()}
                scope="school"
              />
            </div>
          </div>
          )}

          {/* Competency Map Tab */}
          {activeTab === 'competency' && (
            <CompetencyMap
              subjects={[
                {
                  id: 'math',
                  name: 'Mathematics',
                  icon: 'calculator',
                  overallMastery: 78,
                  topics: [
                    {
                      id: 'fractions',
                      name: 'Fractions',
                      overallMastery: 85,
                      competencies: [
                        {
                          id: 'frac-1',
                          name: 'Understanding Fractions',
                          mastery: 95,
                          status: 'mastered',
                          gamesRecommended: false,
                          lastPracticed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                          totalPractices: 12,
                        },
                        {
                          id: 'frac-2',
                          name: 'Adding Fractions',
                          mastery: 80,
                          status: 'in-progress',
                          gamesRecommended: false,
                          lastPracticed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                          totalPractices: 8,
                        },
                        {
                          id: 'frac-3',
                          name: 'Multiplying Fractions',
                          mastery: 65,
                          status: 'in-progress',
                          gamesRecommended: true,
                          lastPracticed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                          totalPractices: 5,
                        },
                      ],
                    },
                    {
                      id: 'decimals',
                      name: 'Decimals',
                      overallMastery: 70,
                      competencies: [
                        {
                          id: 'dec-1',
                          name: 'Understanding Decimals',
                          mastery: 75,
                          status: 'in-progress',
                          gamesRecommended: false,
                          lastPracticed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                          totalPractices: 6,
                        },
                        {
                          id: 'dec-2',
                          name: 'Adding Decimals',
                          mastery: 65,
                          status: 'in-progress',
                          gamesRecommended: true,
                          lastPracticed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                          totalPractices: 4,
                        },
                      ],
                    },
                  ],
                },
                {
                  id: 'english',
                  name: 'English',
                  icon: 'book',
                  overallMastery: 82,
                  topics: [
                    {
                      id: 'reading',
                      name: 'Reading Comprehension',
                      overallMastery: 88,
                      competencies: [
                        {
                          id: 'read-1',
                          name: 'Main Idea',
                          mastery: 92,
                          status: 'mastered',
                          gamesRecommended: false,
                          lastPracticed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                          totalPractices: 10,
                        },
                        {
                          id: 'read-2',
                          name: 'Inference',
                          mastery: 84,
                          status: 'in-progress',
                          gamesRecommended: false,
                          lastPracticed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                          totalPractices: 7,
                        },
                      ],
                    },
                    {
                      id: 'writing',
                      name: 'Writing',
                      overallMastery: 76,
                      competencies: [
                        {
                          id: 'write-1',
                          name: 'Essay Structure',
                          mastery: 70,
                          status: 'in-progress',
                          gamesRecommended: true,
                          lastPracticed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                          totalPractices: 5,
                        },
                        {
                          id: 'write-2',
                          name: 'Grammar',
                          mastery: 82,
                          status: 'in-progress',
                          gamesRecommended: false,
                          lastPracticed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                          totalPractices: 9,
                        },
                      ],
                    },
                  ],
                },
                {
                  id: 'science',
                  name: 'Science',
                  icon: 'flask',
                  overallMastery: 68,
                  topics: [
                    {
                      id: 'biology',
                      name: 'Biology',
                      overallMastery: 72,
                      competencies: [
                        {
                          id: 'bio-1',
                          name: 'Plant Parts',
                          mastery: 80,
                          status: 'in-progress',
                          gamesRecommended: false,
                          lastPracticed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                          totalPractices: 6,
                        },
                        {
                          id: 'bio-2',
                          name: 'Photosynthesis',
                          mastery: 64,
                          status: 'in-progress',
                          gamesRecommended: true,
                          lastPracticed: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                          totalPractices: 3,
                        },
                      ],
                    },
                  ],
                },
              ]}
              onStartPractice={(competencyId) => {
                console.log('Start practice for:', competencyId);
                router.push(`/student/tutor-dashboard?competency=${competencyId}`);
              }}
            />
          )}
        </div>
      </main>
      <FloatingConceptChat
        studentName={studentName}
        grade={profile?.grade}
        language={profile?.preferredLanguage ?? 'mixed'}
      />
    </div>
  );
}
