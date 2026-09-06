'use client';

/**
 * PUBLIC DEMO PAGE FOR STUDENTS
 * 
 * This is a non-authenticated demonstration of the student experience.
 * No real user data, no Supabase session required.
 * 
 * Use case: Allow external users, potential adopters, and evaluators to 
 * explore the student interface without signing up.
 * 
 * Security: This page uses mock data only. No backend calls, no persistence.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Gamepad2,
  GraduationCap,
  MessageCircle,
  TrendingUp,
  Trophy,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function StudentDemoPage() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">
              👋 Welcome to SyncSenta Demo
            </CardTitle>
            <CardDescription>
              Experience Grade 2 learning without creating an account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Demo Mode</AlertTitle>
              <AlertDescription>
                This is a demonstration using sample data. No real student information is used or stored.
                To access the full experience with personalized learning, real progress tracking, and teacher feedback,
                please sign up for an account.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="font-semibold">What you'll see in this demo:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Grade 2 dashboard with subject progress tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Interactive learning activities and exercises</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>CBC-aligned curriculum content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Gamification and achievement system</span>
                </li>
              </ul>

              <h3 className="font-semibold pt-2">What's not available in demo mode:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">✗</span>
                  <span>AI-powered chat assistance (requires authentication)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">✗</span>
                  <span>Progress saving and personalized learning paths</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">✗</span>
                  <span>Teacher feedback and family updates</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={() => setShowOnboarding(false)} 
                size="lg"
                className="flex-1"
              >
                <Gamepad2 className="mr-2 h-4 w-4" />
                Explore Demo
              </Button>
              <Button 
                onClick={() => router.push('/signup')} 
                size="lg"
                variant="outline"
                className="flex-1"
              >
                <GraduationCap className="mr-2 h-4 w-4" />
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Banner */}
      <div className="bg-amber-50 border-b border-amber-200 py-2 px-4">
        <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">
              Demo Mode - Sample data only
            </span>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => router.push('/signup')}
            className="bg-white"
          >
            Sign up for real account
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline mb-2">
            Hello, Demo Student! 👋
          </h1>
          <p className="text-muted-foreground">
            Grade 2 · Lower Primary · This Week: Mathematics & Environmental Activities
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Current Streak</CardDescription>
              <CardTitle className="text-2xl">5 days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>Keep it up!</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Lessons Completed</CardDescription>
              <CardTitle className="text-2xl">12 / 20</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>60% done this week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Level</CardDescription>
              <CardTitle className="text-2xl">Explorer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span>245 / 500 XP to Achiever</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subjects */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Subjects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Mathematics', progress: 65, icon: '🔢', color: 'bg-blue-500' },
              { name: 'English', progress: 45, icon: '📚', color: 'bg-green-500' },
              { name: 'Kiswahili', progress: 55, icon: '🗣️', color: 'bg-purple-500' },
              { name: 'Environmental Activities', progress: 80, icon: '🌍', color: 'bg-teal-500' },
              { name: 'Creative Arts', progress: 40, icon: '🎨', color: 'bg-pink-500' },
              { name: 'Physical Education', progress: 70, icon: '⚽', color: 'bg-orange-500' },
            ].map((subject) => (
              <Card key={subject.name} className="cursor-pointer hover:border-primary transition">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{subject.icon}</div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{subject.name}</CardTitle>
                      <CardDescription>Grade 2</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{subject.progress}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${subject.color} transition-all`}
                        style={{ width: `${subject.progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Today's Activities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Continue Learning
                </CardTitle>
                <CardDescription>
                  Mathematics: Addition and Subtraction within 20
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Start Lesson
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-teal-500" />
                  Interactive Sandbox
                </CardTitle>
                <CardDescription>
                  Practice with games and hands-on activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Gamepad2 className="mr-2 h-4 w-4" />
                  Enter Sandbox
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chat Feature (Locked in Demo) */}
        <Card className="bg-secondary/30 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              AI Learning Assistant
              <Badge variant="secondary" className="ml-auto">Sign up required</Badge>
            </CardTitle>
            <CardDescription>
              Get personalized help, ask questions, and receive adaptive feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The AI chat feature requires an authenticated account to provide personalized,
                safe, and CBC-aligned learning support. Sign up to unlock this feature.
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => router.push('/signup')}
            >
              Create Account to Chat
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Ready to start your real learning journey?</p>
          <Button 
            variant="link" 
            onClick={() => router.push('/signup')}
            className="mt-2"
          >
            Create your SyncSenta account →
          </Button>
        </div>
      </main>
    </div>
  );
}
