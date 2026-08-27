'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, HeartHandshake, ShieldCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ParentLinkingCanvas } from '@/components/parent/parent-linking-canvas';
import { useAuth } from '@/hooks/use-auth';

/**
 * Parent/guardian entry point.
 *
 * This intentionally renders no fabricated learner data. The next integration
 * step is to connect consented guardian-learner relationships from Supabase,
 * then populate the cards through read-only parent APIs.
 */
export default function ParentDashboardPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [hasVerifiedLink, setHasVerifiedLink] = useState(false);

  useEffect(() => {
    setHasVerifiedLink(profile?.role === 'parent' && (profile.children_ids?.length ?? 0) > 0);
  }, [profile]);

  if (loading) {
    return <main className="education-shell flex min-h-screen items-center justify-center p-6"><p className="text-sm text-muted-foreground">Preparing your private family space…</p></main>;
  }

  if (!user) {
    return (
      <main className="education-shell flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Sign in to connect a learner</CardTitle><CardDescription>No learner information is available before authentication and a verified relationship.</CardDescription></CardHeader>
          <CardContent><Button asChild className="w-full"><Link href="/login?next=/parent">Sign in securely <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardContent>
        </Card>
      </main>
    );
  }

  if (profile?.role === 'parent' && !hasVerifiedLink) {
    return (
      <main className="education-shell min-h-screen p-6 md:p-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="space-y-3"><Badge variant="secondary">Parent / guardian</Badge><h1 className="text-3xl font-bold tracking-tight md:text-4xl">Your private family space</h1><p className="max-w-2xl text-muted-foreground">No learner information is shown on this account yet. Connect only a learner who intentionally shares their one-time code with you.</p></header>
          <ParentLinkingCanvas onLinked={() => void refreshProfile()} />
          <p className="text-center text-xs text-muted-foreground">A wallet address, email address, or school name alone never grants access to a learner.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="education-shell min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-3">
          <Badge variant="secondary">Parent / guardian</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Stay close to learning without taking over
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            This dashboard is the connection point for a learner’s progress,
            teacher communication, voluntary wellbeing check-ins, and consent settings.
            Learner information appears only after a verified relationship is
            connected.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" aria-label="Parent dashboard areas">
          <Card>
            <CardHeader>
              <BookOpen className="mb-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Learning progress</CardTitle>
              <CardDescription>Competency progress and recent learning activity.</CardDescription>
            </CardHeader>
            <CardContent><Badge variant="outline">Connect a learner</Badge></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Users className="mb-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Teacher connection</CardTitle>
              <CardDescription>Messages, assignments, and support requests.</CardDescription>
            </CardHeader>
            <CardContent><Badge variant="outline">Connect a school</Badge></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <HeartHandshake className="mb-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Wellbeing support</CardTitle>
              <CardDescription>Voluntary learner check-ins with human support when needed.</CardDescription>
            </CardHeader>
            <CardContent><Badge variant="outline">Not yet connected</Badge></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Privacy and consent</CardTitle>
              <CardDescription>Choose who can view and support information the learner shares.</CardDescription>
            </CardHeader>
            <CardContent><Badge variant="outline">Review settings</Badge></CardContent>
          </Card>
        </section>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Nothing is linked yet</CardTitle>
            <CardDescription>
              The dashboard is ready for the verified guardian–learner connection flow.
              No progress or wellbeing information is shown until consent and identity
              checks are complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/signup">Create or connect an account <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/terms">Review privacy and terms</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
